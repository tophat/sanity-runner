import { type TestRunResult, TestStatus } from '../types'

export function parseStatus(result: TestRunResult): TestStatus {
    const testResults = Object.values(result.result?.testResults ?? {})[0]

    if (testResults.testsuites.testsuite?.[0].$.skipped) {
        return TestStatus.Skipped
    }
    if (result.result?.passed) {
        return TestStatus.Passed
    }
    if (result.error) {
        return TestStatus.Error
    }

    return TestStatus.Failed
}
