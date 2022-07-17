import chalk from 'chalk'

import type { ClientConfiguration, JUnitReport } from '@tophat/sanity-runner-types'

import { getLogger } from '../logger'

import type { AggregatedTestRunResults } from '../types'

function formatTotal(failures: number, skipped: number, total: number): string {
    const result: Array<string> = []
    if (failures) result.push(chalk.bold.red(`${failures} failed`))
    if (skipped) result.push(chalk.bold.yellow(`${skipped} skipped`))

    const passed = total - failures - skipped
    result.push(chalk.bold.green(`${passed} passed`))
    result.push(`${total} total`)
    return result.join(', ')
}

export async function printTestSummary(
    results: AggregatedTestRunResults,
    { config }: { config: ClientConfiguration },
): Promise<void> {
    const logger = getLogger()
    const allResults: Array<JUnitReport['testsuites']> = []

    const testCases: Record<
        string,
        {
            status: 'PASS' | 'FAIL' | 'SKIP'
            failure?: string
            name: string
            time: number
        }
    > = {}

    for (const junitReport of Object.values(results.testResults)) {
        allResults.push(junitReport.testsuites)

        for (const suite of junitReport.testsuites.testsuite) {
            const { failures, skipped, tests, name, time } = suite.$

            if (Number(failures)) {
                testCases[name] = {
                    status: 'FAIL',
                    name: suite.testcase.map((testcase) => testcase.$.name).join(','),
                    time,
                    failure: suite.testcase
                        .map((testcase) => testcase.failure.join('\n'))
                        .join('\n'),
                }
                continue
            }

            if (Number(skipped) === Number(tests)) {
                testCases[name] = {
                    status: 'SKIP',
                    name,
                    time,
                }
                continue
            }

            testCases[name] = {
                status: 'PASS',
                name,
                time,
            }
        }
    }

    const counts = {
        numTestSuites: 0,
        numTestSuiteFailures: 0,
        numTestSuiteSkipped: 0,
        numTestCases: 0,
        numTestCaseFailures: 0,
        numTestCaseSkipped: 0,
        testTime: 0,
    }
    for (const result of allResults) {
        counts.testTime += Number(result.$.time) || 0

        for (const testSuite of result.testsuite) {
            const numFailed = Number(testSuite.$.failures ?? 0)
            const numSkipped = Number(testSuite.$.skipped ?? 0)
            const numTests = Number(testSuite.$.tests ?? 0)

            counts.numTestSuites += 1
            counts.numTestCases += numTests
            counts.numTestCaseFailures += numFailed
            counts.numTestCaseSkipped += numSkipped
            if (numFailed) {
                counts.numTestSuiteFailures += 1
            } else if (numSkipped === numTests) {
                counts.numTestSuiteSkipped += 1
            }
        }
    }

    if (config.logFormat === 'terminal') {
        const testSuiteResult = formatTotal(
            counts.numTestSuiteFailures,
            counts.numTestSuiteSkipped,
            counts.numTestSuites,
        )
        const testCasesResult = formatTotal(
            counts.numTestCaseFailures,
            counts.numTestCaseSkipped,
            counts.numTestCases,
        )

        for (const [name, result] of Object.entries(testCases)) {
            if (result.status === 'PASS') {
                logger.info(`${chalk.black.bold.bgGreen(' PASS ')} ${name} (${result.time}s)`)
            } else if (result.status === 'SKIP') {
                logger.info(`${chalk.black.bold.bgYellow(' SKIP ')} ${name} (${result.time}s)`)
            } else if (result.status === 'FAIL') {
                logger.info(`${chalk.black.bold.bgRed(' FAIL ')} ${name} (${result.time}s)`)
                logger.info(`${chalk.red(`• ${result.name}`)}`)
                logger.info(`${result.failure}`)
            }
        }

        logger.info(`${chalk.bold('Test Suites:')} ${testSuiteResult}`)
        logger.info(`${chalk.bold('Tests:')}       ${testCasesResult}`)
        logger.info(`${chalk.bold('Time:')}        ${counts.testTime}s\n`)
    } else {
        for (const [, result] of Object.entries(testCases)) {
            logger.info(result)
        }
        logger.info({
            num_test_suites_failed: counts.numTestCaseFailures,
            num_test_suites_skipped: counts.numTestSuiteSkipped,
            num_test_suites: counts.numTestSuites,
            num_test_cases_failed: counts.numTestCaseFailures,
            num_test_cases_skipped: counts.numTestCaseSkipped,
            num_test_cases: counts.numTestCases,
            total_test_time: counts.testTime,
        })
    }
}
