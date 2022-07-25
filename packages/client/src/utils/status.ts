import type { JUnitReport } from '@tophat/sanity-runner-types'

import { type TestRunResult, TestStatus } from '../types'

export function parseStatus(result: TestRunResult): TestStatus {
    const testResults: JUnitReport | undefined = Object.values(result.result?.testResults ?? {})[0]

    if (testResults?.testsuites) {
        if (testResults.testsuites.testsuite?.[0].$.skipped) {
            return TestStatus.Skipped
        }
        if (result.result?.passed) {
            return TestStatus.Passed
        }
    }

    if (!testResults || result.error) {
        return TestStatus.Error
    }
    return TestStatus.Failed
}
