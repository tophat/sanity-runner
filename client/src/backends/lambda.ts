import https from 'https'

import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'

import type { InvokePayload, InvokeResponsePayload } from '@tophat/sanity-runner-types'

import { formatFailedTestResult } from './utils'

import type { InvokeBackend, TaskPayload, TestRunResult } from '../types'

const httpsAgent = new https.Agent({
    keepAlive: true,
})

export class InvokeLambda implements InvokeBackend {
    BackendName = 'Lambda'

    constructor() {}

    async invoke({ config, filename, code, executionId }: TaskPayload): Promise<TestRunResult> {
        try {
            const client = new LambdaClient({
                apiVersion: '2015-03-31',
                maxAttempts: 1,
                requestHandler: new NodeHttpHandler({
                    httpsAgent,
                }),
            })

            const lambdaPayload: InvokePayload = {
                testFiles: { [filename]: code },
                testVariables: config.vars,
                retryCount: config.retryCount,
                executionId,
            }

            const response = await client.send(
                new InvokeCommand({
                    FunctionName: config.lambdaFunction,
                    Payload: Buffer.from(JSON.stringify(lambdaPayload)),
                }),
            )

            if (response.FunctionError && !response.Payload) {
                throw new Error(response.FunctionError)
            }

            if (!response.Payload) {
                throw new Error('No response from Lambda.')
            }

            const result: InvokeResponsePayload = JSON.parse(
                Buffer.from(response.Payload).toString('utf-8'),
            )

            return {
                filename,
                result,
            }
        } catch (error) {
            return {
                filename,
                error: error instanceof Error ? error : new Error(String(error)),
                result: {
                    passed: false,
                    testResults: {
                        [filename]: formatFailedTestResult(
                            filename,
                            `[Lambda Failure] ${String(error)}`,
                        ),
                    },
                },
            }
        }
    }
}
