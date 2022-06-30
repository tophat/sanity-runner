import type { BaseContext } from 'clipanion'

export enum LogFormat {
    Structured = 'structured',
    Terminal = 'terminal',
}

export enum LogLevel {
    error = 0,
    warn = 1,
    info = 2,
    http = 3,
    verbose = 4,
    debug = 5,
    silly = 6,
}

export interface Configuration {
    testDir: string
    include?: string
    exclude?: string
    lambdaFunction: string
    localPort: number
    local: boolean
    outputDir: string
    retryCount: number
    timeout: number
    vars: Partial<Record<string, string>>
    testPathPatterns: Array<string>
    logFormat: LogFormat
    logLevel: keyof typeof LogLevel
    progress: boolean
    concurrency: number
}

export type ExecutionContext = BaseContext

export interface RunResults {
    success: boolean
    duration: number
    executionId: string
}

type TestFilename = string
type JUnitReportFilename = string

type StringifiedJUnitReport = string

export type JUnitReport = {
    testsuites: {
        $: {
            name: string
            failures: number
            tests: number
            time: number
        }
        testsuite: Array<{
            $: {
                failures: number
                skipped?: number
                tests: number
                name: string
                time: number
            }
            testcase: Array<{
                failure: Array<string>
                $: {
                    classname: string
                    name: string
                    time: number
                }
            }>
        }>
    }
}

export type InvokeResponsePayload = {
    passed: boolean
    screenshots?: Record<TestFilename, string>
    errors?: Array<{
        message: string
        name?: string
    }>
    testResults: Record<JUnitReportFilename, StringifiedJUnitReport | JUnitReport>
}

export type AggregatedTestRunResults = InvokeResponsePayload

export interface TestRunResult {
    filename: TestFilename
    error?: Error
    result?: InvokeResponsePayload
}

export interface TaskPayload {
    config: Configuration
    filename: TestFilename
    code: string
    executionId: string
}

export interface InvokeBackendConstructor {
    new (): InvokeBackend
}

export interface InvokeBackend {
    invoke(params: TaskPayload): Promise<TestRunResult>
    BackendName: string
}
