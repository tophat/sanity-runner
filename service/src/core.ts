import childProcess from 'child_process'

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

import TestRunner from './utils/testRunner'

export async function service(event: InvokePayload): Promise<InvokeResponsePayload> {
    if (process.env.DEBUG?.includes('sanity-runner')) {
        childProcess.execSync('find /tmp', { encoding: 'utf-8', stdio: 'inherit' })
    }

    const hooks: PluginHooks = {
        onTestFailure: new AsyncSeriesHook(['context']),
        onTestSuccess: new AsyncSeriesHook(['context']),
        beforeBrowserCleanup: new AsyncSeriesHook(['context']),
    }

    // In a future version of the sanity runner, these plugins will be dynamically loaded.
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

    const testMetadata: TestMetadata = parse(Object.values(event.testFiles)[0])

    const runner = new TestRunner()
    const testResults = await runner.runTests({
        testFiles: event.testFiles,
        testVariables: event.testVariables,
        maxRetryCount: event.retryCount,
        executionId: event.executionId,
        hooks,
        testMetadata,
    })
    return testResults
}
