import axios from 'axios'

import type { InvokePayload, InvokeResponsePayload } from '@tophat/sanity-runner-types'

import { formatFailedTestResult } from './utils'

import type { InvokeBackend, TaskPayload, TestRunResult } from '../types'

export class InvokeLocal implements InvokeBackend {
    BackendName = 'Local'

    constructor() {}

    async invoke({ config, filename, code, executionId }: TaskPayload): Promise<TestRunResult> {
        try {
            const invokePayload: InvokePayload = {
                testFiles: { [filename]: code },
                testVariables: config.vars,
                retryCount: config.retryCount,
                executionId,
                defaultViewport: config.defaultViewport,
            }

            const response = await axios.post<InvokeResponsePayload>(
                `http://localhost:${config.localPort}/2015-03-31/functions/function/invocations`,
                invokePayload,
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
