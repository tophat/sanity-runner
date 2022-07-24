import childProcess from 'child_process'
import crypto from 'crypto'

import { parse } from 'jest-docblock'
import { AsyncSeriesHook } from 'tapable'

import FullStoryPlugin, { getFullStoryUrl } from '@tophat/sanity-runner-plugin-fullstory'
import PagerDutyPlugin from '@tophat/sanity-runner-plugin-pagerduty'
import SlackPlugin from '@tophat/sanity-runner-plugin-slack'
import type {
    InvokePayload,
    InvokeResponsePayload,
    PluginHooks,
    TestMetadata,
} from '@tophat/sanity-runner-types'

import { logger } from './logger'
import { runTest } from './runTest'

export async function service(event: InvokePayload): Promise<InvokeResponsePayload> {
    const runId = crypto.randomUUID()

    if (process.env.DEBUG?.includes('sanity-runner')) {
        childProcess.execSync('find /tmp', { encoding: 'utf-8', stdio: 'inherit' })
    }

    const hooks: PluginHooks = {
        onTestFailure: new AsyncSeriesHook(['context']),
        onTestSuccess: new AsyncSeriesHook(['context']),
        beforeBrowserCleanup: new AsyncSeriesHook(['context']),
    }

    // In a future version of the sanity runner, these plugins will be dynamically loaded.
    logger.info('Initializing plugins: FullStory, Slack, PagerDuty.', {
        run_id: runId,
        execution_id: event.executionId,
    })
    FullStoryPlugin(hooks)
    SlackPlugin(hooks, {
        linkFactory: async () => {
            // TODO: Explore alternative way of integrating 2 plugins (fullstory + slack)
            // Perhaps we create some concept of "shared context"?
            const fullstoryUrl = await getFullStoryUrl()
            return fullstoryUrl ? [{ name: 'Fullstory Session', url: fullstoryUrl }] : []
        },
    })
    PagerDutyPlugin(hooks)

    // We only support 1 test per service invocation.
    const [testFilename, testCode] = Object.entries(event.testFiles)[0]
    const testMetadata: TestMetadata = parse(testFilename)

    const testResults = await runTest({
        testFilename,
        testCode,
        testVariables: event.testVariables,
        maxRetryCount: event.retryCount,
        executionId: event.executionId,
        runId,
        hooks,
        testMetadata,
        defaultViewport: {
            width: event.defaultViewport?.width ?? 1920,
            height: event.defaultViewport?.height ?? 1080,
        },
    })

    logger.info('Test run complete.', {
        run_id: runId,
        execution_id: event.executionId,
    })

    return testResults
}
