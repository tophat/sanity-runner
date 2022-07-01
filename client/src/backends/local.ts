import axios from 'axios'

import { formatFailedTestResult } from './utils'

import type { InvokeBackend, InvokeResponsePayload, TaskPayload, TestRunResult } from '../types'

export class InvokeLocal implements InvokeBackend {
    BackendName = 'Local'

    constructor() {}

    async invoke({ config, filename, code, executionId }: TaskPayload): Promise<TestRunResult> {
        try {
            const response = await axios.post<InvokeResponsePayload>(
                `http://localhost:${config.localPort}/2015-03-31/functions/function/invocations`,
                JSON.stringify({
                    testFiles: { [filename]: code },
                    testVariables: config.vars,
                    retryCount: config.retryCount,
                    executionId,
                }),
            )

            return {
                filename,
                result: response.data,
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
                            axios.isAxiosError(error) && error.response?.status
                                ? `[Lambda Failure] Status Code: ${error.response?.status}. Message: ${error.response?.data}`
                                : `[Lambda Failure] ${String(error)}`,
                        ),
                    },
                },
            }
        }
    }
}
