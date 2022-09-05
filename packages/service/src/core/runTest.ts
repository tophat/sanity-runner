import type {
    InvokeResponsePayload,
    OnTestCompleteContext,
    SanityRunnerTestGlobals,
    TestMetadata,
} from '@tophat/sanity-runner-types'

import { logger, printAggregatedTestResult } from './logger'
import JestPuppeteerTestRunner from './runners/jest'
import { getSecretValue } from './secrets'
import { trace, tracer } from './tracer'
import { RunTestContext } from './types'
import { version } from './version'

declare let global: typeof globalThis & {
    /** Only for internal use. */
    _sanityRunnerTestGlobals?: SanityRunnerTestGlobals
}

export async function runTest(runTestContext: RunTestContext): Promise<InvokeResponsePayload> {
    const runner = new JestPuppeteerTestRunner(runTestContext)

    tracer
        ?.scope()
        .active()
        ?.addTags({
            'sanity_runner.version': version,
            'sanity_runner.run_id': runTestContext.runId,
            'sanity_runner.execution_id': runTestContext.executionId,
            'sanity_runner.max_retry_count': (runTestContext.maxAttempts ?? 1) - 1,
        })

    try {
        await runner.writeTestCodeToDisk({ testCode: runTestContext.testCode })

        // We'll inject hooks into the global object so it can be accessed
        // from within the jest test hook files. Note that this depends on jest
        // running "in band" (not as a separate process).
        global._sanityRunnerTestGlobals = {
            sanityRunnerHooks: { beforeBrowserCleanup: runTestContext.hooks.beforeBrowserCleanup },
            runId: runTestContext.runId,
            testVariables: runTestContext.testVariables,
            testMetadata: runTestContext.testMetadata,
            defaultViewport: runTestContext.defaultViewport,
            trace,
        }

        logger.info(
            `Starting test run (${runTestContext.attempt + 1}/${runTestContext.maxAttempts}):`,
            {
                run_id: runTestContext.runId,
                execution_id: runTestContext.executionId,
                test_file: runTestContext.testFilename,
            },
        )
        const results = await trace('Test Run', async (span) => {
            span?.addTags({
                'sanity_runner.attempt': runTestContext.attempt,
                'sanity_runner.runner': runner.name,
            })
            return await runner.run()
        })

        // Cleanup exposed globals
        delete global._sanityRunnerTestGlobals

        const response = await runner.format(results)
        response.pluginOutputs = {}
        const setPluginOutput = (name: string, outputValue: any) => {
            if (response.pluginOutputs) {
                response.pluginOutputs[name] = outputValue
            }
        }
        const context: OnTestCompleteContext<TestMetadata> = {
            logger,
            getSecretValue,
            results: response,
            testMetadata: runTestContext.testMetadata,
            testVariables: runTestContext.testVariables,
            runId: runTestContext.runId,
            testDisplayName:
                results.testResults[0]?.testResults?.[0]?.fullName ?? runTestContext.testFilename,
            testFilename: runTestContext.testFilename,
            failureMessage: results.testResults[0]?.failureMessage ?? undefined,

            attempt: runTestContext.attempt,
            maxAttempts: runTestContext.maxAttempts,
            setPluginOutput,
        }

        tracer?.scope().active()?.addTags({
            'sanity_runner.passed': response.passed,
            'sanity_runner.test_name': context.testDisplayName,
            'sanity_runner.test_filename': context.testFilename,
            'sanity_runner.total_retries': runTestContext.attempt,
        })
        printAggregatedTestResult({
            results,
            testVariables: runTestContext.testVariables,
            retryCount: runTestContext.attempt,
            runId: runTestContext.runId,
            executionId: runTestContext.executionId,
            testFilename: runTestContext.testFilename,
        })

        if (response.passed) {
            await trace('onTestSuccess', async () => {
                await runTestContext.hooks.onTestSuccess.promise(context)
            })
        } else {
            await trace('onTestFailure', async () => {
                await runTestContext.hooks.onTestFailure.promise(context)
            })
        }

        return response
    } finally {
        await runner.cleanup()
    }
}
