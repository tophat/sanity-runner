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
import { downloadFile } from './utils/downloadFile'
import { printTestSummary } from './utils/printTestSummary'

import type {
    AggregatedTestRunResults,
    InvokeBackendConstructor,
    RunResults,
    TaskPayload,
    TestRunResult,
} from './types'

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
    try {
        return await invokeBackend.invoke({ config, filename, code, executionId })
    } finally {
        const duration = Number(process.hrtime.bigint() - startTime) / 1e9
        logger.verbose(
            `[${
                invokeBackend.BackendName
            }] [${executionId}] Finished: '${filename}' [${duration.toFixed(3)}s]`,
        )
    }
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
                filename,
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
        format: `Running Tests |${chalk.cyan('{bar}')}| {percentage}% || {value}/{total} Tests`,
        clearOnComplete: true,
    })

    const httpsAgent = new https.Agent({
        keepAlive: true,
        timeout: config.timeout,
    })

    const tasks = testFilenames.map((filename) => async (): Promise<[string, TestRunResult]> => {
        try {
            const code = testFiles[filename]
            const result = await runTest({ filename, code, config, executionId, httpsAgent })
            if (result.error) {
                // We know it's a lambda failure. May be worth a retry or some other handling.
            }
            return [filename, result]
        } finally {
            if (config.progress) testRunProgressBar.increment()
        }
    })

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

    const results = Object.entries(resultsByTest).reduce(
        (agg, [, runResult]) => ({
            passed: Boolean(agg.passed && runResult.result?.passed),
            testResults: { ...agg.testResults, ...runResult.result?.testResults },
            errors: [...(agg.errors ?? []), ...(runResult.result?.errors ?? [])],
            screenshots: { ...agg.screenshots, ...runResult.result?.screenshots },
        }),
        {
            passed: true,
            testResults: {},
            errors: [],
            screenshots: {},
        } as AggregatedTestRunResults,
    )

    // Download test results to disk (junit reports).
    await Promise.all(
        Object.entries(results.testResults).map(async ([junitFilename, junitResult]) => {
            const outputFilename = path.join(config.outputDir, junitFilename)
            await fs.promises.mkdir(path.dirname(outputFilename), { recursive: true })
            await fs.promises.writeFile(
                outputFilename,
                typeof junitResult === 'string' ? junitResult : JSON.stringify(junitResult),
                'utf-8',
            )
        }),
    )

    try {
        // Download screenshots
        await Promise.all(
            Object.entries(results.screenshots ?? {}).map(async ([screenshotName, url]) => {
                const outputFilename = path.join(config.outputDir, screenshotName)
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

    await printTestSummary(results, { config })

    return { success: results.passed, duration, executionId }
}
