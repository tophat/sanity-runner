import https from 'https'

import AWS from 'aws-sdk'

import { formatFailedTestResult } from './utils'

import type { InvokeBackend, InvokeResponsePayload, TaskPayload, TestRunResult } from '../types'

const agent = new https.Agent({
    keepAlive: true,
})

export class InvokeLambda implements InvokeBackend {
    BackendName = 'Lambda'

    constructor() {}

    async invoke({ config, filename, code, executionId }: TaskPayload): Promise<TestRunResult> {
        try {
            const lambda = new AWS.Lambda({
                apiVersion: '2015-03-31',
                httpOptions: {
                    timeout: config.timeout,
                    agent: agent,
                },
                maxRetries: 1,
            })

            const params: AWS.Lambda.InvocationRequest = {
                FunctionName: config.lambdaFunction,
                Payload: JSON.stringify({
                    testFiles: { [filename]: code },
                    testVariables: config.vars,
                    retryCount: config.retryCount,
                    executionId,
                }),
            }

            const rawResponse = await lambda.invoke(params).promise()
            const result: InvokeResponsePayload = JSON.parse(
                rawResponse.Payload?.toString() ?? 'undefined',
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
