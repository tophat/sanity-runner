import childProcess from 'child_process'

import { parse } from 'jest-docblock'
import { AsyncSeriesHook } from 'tapable'

import PagerDutyPlugin from '@tophat/sanity-runner-plugin-pagerduty'
import SlackPlugin from '@tophat/sanity-runner-plugin-slack'
import type {
    InvokePayload,
    InvokeResponsePayload,
    PluginHooks,
    TestMetadata,
} from '@tophat/sanity-runner-types'

import { getFullStoryUrl } from './fullstory'
import TestRunner from './testRunner'

import type { APIGatewayProxyResultV2, Context } from 'aws-lambda'

export async function handler(
    event: InvokePayload,
    _context: Context,
): Promise<APIGatewayProxyResultV2<InvokeResponsePayload>> {
    if (process.env.DEBUG?.includes('sanity-runner')) {
        childProcess.execSync('find /tmp', { encoding: 'utf-8', stdio: 'inherit' })
    }

    const hooks: PluginHooks = {
        onTestFailure: new AsyncSeriesHook(['context']),
        onTestSuccess: new AsyncSeriesHook(['context']),
    }

    // In a future version of the sanity runner, these plugins will be dynamically loaded.
    SlackPlugin(hooks, {
        linkFactory: async () => {
            const fullstoryUrl =
                event.testVariables?.FULLSTORY_ENABLED === 'true'
                    ? await getFullStoryUrl()
                    : undefined
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
