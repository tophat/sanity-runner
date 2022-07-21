import path from 'path'

import { runCLI } from '@jest/core'
import { AggregatedResult } from '@jest/test-result'
import retry from 'async-retry'

import type {
    DefaultViewport,
    EnhancedAggregatedResult,
    InvokeResponsePayload,
    OnTestCompleteContext,
    PluginHooks,
    SanityRunnerTestGlobals,
    TestMetadata,
    TestVariables,
} from '@tophat/sanity-runner-types'

import { logger } from './logger'
import Run from './run'
import { getSecretValue } from './secrets'

import type { Config } from '@jest/types'

declare let global: typeof globalThis & {
    /** Only for internal use. */
    _sanityRunnerTestGlobals?: SanityRunnerTestGlobals
}

const runJest = async function ({
    config,
}: {
    config: Config.InitialOptions
}): Promise<{ results: EnhancedAggregatedResult }> {
    const jestArgs: Config.Argv = {
        _: [],
        $0: 'sanity-runner',
        json: true,
        runInBand: true,
        config: JSON.stringify(config),
    }
    const { results } = await runCLI(jestArgs, [process.cwd()])

    // insert a newline after the Jest stderr output to make logs easier to read
    process.stderr.write('\n')

    // The AggregatedResult is converted to EnhancedAggregatedResult via a custom reporter.
    return { results } as { results: EnhancedAggregatedResult }
}

const logResults = function (
    results: AggregatedResult,
    testVariables: Record<string, unknown>,
    retryCount: number,
    runId: string,
    executionId: string,
) {
    for (const suiteResults of results.testResults) {
        for (const testCaseResults of suiteResults.testResults) {
            const fileName = path.basename(suiteResults.testFilePath)
            const testName = fileName.substring(0, fileName.lastIndexOf('.'))
            const formatted = {
                variables: testVariables,
                retryCount: retryCount,
                duration: testCaseResults.duration ? testCaseResults.duration / 1000 : null,
                status: suiteResults.numPendingTests > 0 ? 'skipped' : testCaseResults.status,
                endTime: suiteResults.perfStats.end,
                startTime: suiteResults.perfStats.start,
                testName,
                runId: runId,
                executionId: executionId,
            }
            logger.info('Test Case Results', formatted)
        }
    }
}

export default class TestRunner {
    async runTests({
        testFiles,
        testVariables,
        maxRetryCount,
        executionId,
        hooks,
        testMetadata,
        defaultViewport,
    }: {
        testFiles: Record<string, string>
        testVariables: TestVariables
        maxRetryCount: number
        executionId: string
        hooks: PluginHooks
        testMetadata: TestMetadata
        defaultViewport: DefaultViewport
    }): Promise<InvokeResponsePayload> {
        let retryCount = 0
        const run = new Run(testVariables)
        try {
            await run.writeSuites(testFiles)

            // We'll inject hooks into the global object so it can be accessed
            // from within the jest test hook files. Note that this depends on jest
            // running "in band" (not as a separate process).
            global._sanityRunnerTestGlobals = {
                sanityRunnerHooks: { beforeBrowserCleanup: hooks.beforeBrowserCleanup },
                runId: run.id,
                testVariables,
                testMetadata,
                defaultViewport,
            }

            const results = await retry(
                async () => {
                    const { results: jestResults } = await runJest({
                        config: run.jestConfig(),
                    })
                    // force retry if test was unsuccesfull
                    // if last retry, return as normal
                    if (!jestResults.success) {
                        if (retryCount !== maxRetryCount) {
                            throw new Error('Test Failed!')
                        }
                    }
                    return jestResults
                },
                {
                    retries: maxRetryCount,
                    onRetry: function () {
                        retryCount++
                    },
                },
            )

            // Cleanup exposed globals
            delete global._sanityRunnerTestGlobals

            logResults(results, testVariables, retryCount, run.id, executionId)

            const response = await run.format(results)

            const context: OnTestCompleteContext<TestMetadata> = {
                logger,
                getSecretValue,
                results: response,
                testMetadata,
                testVariables,
                runId: run.id,
                testDisplayName: results.testResults[0].displayName?.name ?? 'Unknown',
                testFilename: Object.keys(testFiles)[0] ?? 'Unknown',
                failureMessage: results.testResults[0]?.failureMessage ?? undefined,
            }

            if (response.passed) {
                await hooks.onTestSuccess.promise(context)
            } else {
                await hooks.onTestFailure.promise(context)
            }

            return response
        } finally {
            await run.cleanup()
        }
    }
}
