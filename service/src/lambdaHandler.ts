import childProcess from 'child_process'

import type { InvokePayload, InvokeResponsePayload } from '@tophat/sanity-runner-types'

import TestRunner from './testRunner'

import type { APIGatewayProxyResultV2, Context } from 'aws-lambda'

export async function handler(
    event: InvokePayload,
    _context: Context,
): Promise<APIGatewayProxyResultV2<InvokeResponsePayload>> {
    if (process.env.DEBUG?.includes('sanity-runner')) {
        childProcess.execSync('find /tmp', { encoding: 'utf-8', stdio: 'inherit' })
    }
    const runner = new TestRunner()
    const testResults = await runner.runTests(
        event.testFiles,
        event.testVariables,
        event.retryCount,
        event.executionId,
    )
    return testResults
}
