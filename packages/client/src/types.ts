import type {
    ClientConfiguration,
    InvokeResponsePayload,
    TestFilename,
} from '@tophat/sanity-runner-types'

import type { BaseContext } from 'clipanion'
import type { Agent } from 'https'

export type LogFormat = 'structured' | 'terminal'

export enum LogLevel {
    error = 0,
    warn = 1,
    info = 2,
    http = 3,
    verbose = 4,
    debug = 5,
    silly = 6,
}

export type ExecutionContext = BaseContext

export interface RunResults {
    success: boolean
    duration: number
    executionId: string
}

export type AggregatedTestRunResults = InvokeResponsePayload

export interface TestRunResult {
    filename: TestFilename
    error?: Error
    result?: InvokeResponsePayload
}

export interface TaskPayload {
    config: ClientConfiguration
    filename: TestFilename
    code: string
    executionId: string
    attempt: number
    maxAttempts: number
    httpsAgent?: Agent
}

export interface InvokeBackendConstructor {
    new (): InvokeBackend
}

export interface InvokeBackend {
    invoke(params: TaskPayload): Promise<TestRunResult>
    BackendName: string
}

export enum TestStatus {
    Passed = 'passed',
    Skipped = 'skipped',
    Error = 'error',
    Failed = 'failed',
}
