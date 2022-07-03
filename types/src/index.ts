export interface ClientConfiguration {
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
    logFormat: 'structured' | 'terminal'
    logLevel: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly'
    progress: boolean
    concurrency: number
}

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

export type TestFilename = string

export type JUnitReportFilename = string

export type StringifiedJUnitReport = string

export type ReportScreenshots = Partial<Record<TestFilename, string>>

export type InvokeResponsePayload = {
    passed: boolean
    screenshots?: ReportScreenshots
    errors?: Array<{
        message: string
        name?: { name: string }
    }>
    testResults: Record<JUnitReportFilename, StringifiedJUnitReport | JUnitReport>
}

export type TestVariables = Partial<Record<string, string>>

export type InvokePayload = {
    testFiles: Record<string, string>
    testVariables: TestVariables
    retryCount: number
    executionId: string
}
