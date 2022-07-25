import path from 'path'

import junitBuilder from 'junit-report-builder'

import { TestRunResult, TestStatus } from './types'
import { parseStatus } from './utils/status'

export async function writeJUnitReport({
    resultsByTest,
    outputDir,
    executionId,
}: {
    resultsByTest: Record<string, TestRunResult>
    outputDir: string
    executionId: string
}): Promise<void> {
    const outputFilename = path.resolve(outputDir, `${executionId}.junit.xml`)

    const suite = junitBuilder.testSuite().name('Sanity Runner')
    for (const [filename, result] of Object.entries(resultsByTest)) {
        const testCase = suite.testCase().name(filename)

        const testResults = Object.values(result.result?.testResults ?? {})[0]
        if (testResults.testsuites.$.time) {
            testCase.time(testResults.testsuites.$.time)
        }

        const status = parseStatus(result)
        if (status === TestStatus.Skipped) {
            testCase.skipped()
        } else if (status === TestStatus.Error) {
            testCase.error('Error running test.', 'error', result.error?.toString() ?? '')
        } else if (status === TestStatus.Failed) {
            const failures = testResults.testsuites.testsuite?.[0].testcase?.[0].failure
            testCase.failure(failures ? failures.join('\n') : 'Unknown failure.', 'failure')
        }
    }

    junitBuilder.writeTo(outputFilename)
}
