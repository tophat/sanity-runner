import crypto from 'crypto'
import fs from 'fs'
import https from 'https'
import path from 'path'

import chalk from 'chalk'
import cliProgress from 'cli-progress'
import pLimit from 'p-limit'

import type { ClientConfiguration } from '@tophat/sanity-runner-types'

import { InvokeLambda } from './backends/lambda'
import { InvokeLocal } from './backends/local'
import { disableProgress, enableProgress, getLogger } from './logger'
import { writeJUnitReport } from './reporter'
import {
    AggregatedTestRunResults,
    InvokeBackendConstructor,
    RunResults,
    TaskPayload,
    TestRunResult,
    TestStatus,
} from './types'
import { downloadFile } from './utils/downloadFile'
import { printTestSummary } from './utils/printTestSummary'
import { parseStatus } from './utils/status'

async function runTest({
    config,
    filename,
    code,
    executionId,
}: TaskPayload): Promise<TestRunResult> {
    const logger = getLogger()

    const InvokeBackendClass: InvokeBackendConstructor = config.local ? InvokeLocal : InvokeLambda
    const invokeBackend = new InvokeBackendClass()

    const startTime = process.hrtime.bigint()
    logger.verbose(`[${invokeBackend.BackendName}] [${executionId}] Running: '${filename}'`)
    let status: TestStatus | null = null
    try {
        const result = await invokeBackend.invoke({ config, filename, code, executionId })
        status = parseStatus(result)
        return result
    } finally {
        const duration = Number(process.hrtime.bigint() - startTime) / 1e9
        logger.verbose(
            `[${invokeBackend.BackendName}] [${executionId}] Finished: '${filename}' [${
                status ?? TestStatus.Error
            }] [${duration.toFixed(3)}s]`,
        )
    }
}

function baseFilename(filename: string, { cwd }: { cwd: string }) {
    let name = path.relative(cwd, filename)
    name = name.substring(0, name.lastIndexOf('.test')) // strip test file extension
    return name
}

export async function runTests({
    config,
    testFilenames,
}: {
    config: ClientConfiguration
    testFilenames: Array<string>
}): Promise<RunResults> {
    const logger = getLogger()
    const startTime = process.hrtime.bigint()

    // Used to track a run of the sanity runner.
    const executionId = crypto.randomUUID()

    // We assume each test file can be run in isolation. It's the responsibility
    // of the user to pre-bundle the test files.
    const testFiles: Record<string, string> = Object.fromEntries(
        await Promise.all(
            testFilenames.map(async (filename) => [
                baseFilename(filename, { cwd: config.testDir }),
                await fs.promises.readFile(filename, 'utf-8'),
            ]),
        ),
    )

    const concurrency = config.local ? 1 : config.concurrency
    if (config.concurrency !== Infinity && config.concurrency > 1 && config.local) {
        logger.warn('Local mode only supports a concurrency of 1.')
    }

    const limit = pLimit(concurrency)
    logger.verbose(
        `Tests: ${testFilenames.length} / Concurrency: ${
            concurrency === Infinity ? 'No Limit' : concurrency
        }`,
    )

    const testRunProgressBar = new cliProgress.SingleBar({
        format: `Running Tests |${chalk.cyan(
            '{bar}',
        )}| {percentage}% || {duration_formatted} || {value}/{total} Tests`,
        clearOnComplete: true,
    })

    const httpsAgent = new https.Agent({
        keepAlive: true,
        timeout: config.timeout,
    })

    const tasks = Object.entries(testFiles).map(
        ([filename, code]) =>
            async (): Promise<[string, TestRunResult]> => {
                try {
                    const result = await runTest({
                        filename,
                        code,
                        config,
                        executionId,
                        httpsAgent,
                    })
                    if (result.error) {
                        // We know it's a lambda failure. May be worth a retry or some other handling.
                    }
                    return [filename, result]
                } finally {
                    if (config.progress) testRunProgressBar.increment()
                }
            },
    )

    if (config.progress) {
        enableProgress()
        testRunProgressBar.start(testFilenames.length, 0)
    }
    let resultsByTest: Record<string, TestRunResult>
    try {
        resultsByTest = Object.fromEntries(
            await Promise.all(tasks.map((task) => limit(task))).finally(() => {
                testRunProgressBar.stop()
            }),
        )
    } finally {
        disableProgress()
    }

    const duration = Number(process.hrtime.bigint() - startTime) / 1e9

    const results = Object.entries(resultsByTest).reduce<AggregatedTestRunResults>(
        (agg, [, runResult]) => {
            agg.passed = Boolean(agg.passed && runResult.result?.passed)

            if (runResult.result) {
                if (runResult.result.testResults) {
                    agg.testResults ??= {}
                    agg.testResults[runResult.filename] = Object.values(
                        runResult.result.testResults,
                    )[0]
                }
                agg.errors?.push(...(runResult.result?.errors ?? []))
                agg.screenshots ??= {}
                if (runResult.result.screenshots) {
                    agg.screenshots[runResult.filename] = Object.values(
                        runResult.result.screenshots,
                    )[0]
                }
            }

            agg.errors = [...(agg.errors ?? [])]
            agg.screenshots = { ...agg.screenshots, ...runResult.result?.screenshots }
            return agg
        },
        {
            passed: true,
            testResults: {},
            errors: [],
            screenshots: {},
        },
    )

    try {
        // Download screenshots
        await Promise.all(
            Object.entries(results.screenshots ?? {}).map(async ([runTestFilename, url]) => {
                const screenshotName = runTestFilename.substring(
                    0,
                    runTestFilename.lastIndexOf('.test.js'),
                )
                const outputFilename = path.join(config.outputDir, runTestFilename)
                try {
                    if (url) {
                        await downloadFile(outputFilename, url)
                        logger.verbose(
                            `[Screenshot] Downloaded '${screenshotName}' to ${outputFilename}`,
                        )
                    }
                } catch (err) {
                    logger.error(
                        `[Screenshot] Failed downloading screenshot for '${screenshotName}'`,
                        err,
                    )
                }
            }),
        )
    } catch (err) {
        logger.error('Failed to download all screenshots.', err)
    }

    // Write aggregated junit report
    await writeJUnitReport({
        resultsByTest,
        outputDir: config.outputDir,
        executionId,
    })

    await printTestSummary(results, { config })

    return { success: results.passed, duration, executionId }
}
