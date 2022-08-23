import { AggregatedResult } from '@jest/test-result'
import winston from 'winston'

import { version } from './version'

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: {
        sanity_runner_version: version,
    },
    transports: [
        new winston.transports.Console({
            format: winston.format.json(),
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        }),
    ],
})

logger.exitOnError = false

export function printAggregatedTestResult({
    results,
    testVariables,
    retryCount,
    runId,
    executionId,
    testFilename,
}: {
    results: AggregatedResult
    testVariables: Record<string, unknown>
    retryCount: number
    runId: string
    executionId: string
    testFilename: string
}) {
    for (const suiteResults of results.testResults) {
        for (const testCaseResults of suiteResults.testResults) {
            const formatted = {
                variables: testVariables,
                retryCount: retryCount,
                // in nanoseconds
                duration: testCaseResults.duration ? testCaseResults.duration * 1e6 : null,
                status: suiteResults.numPendingTests > 0 ? 'skipped' : testCaseResults.status,
                endTime: suiteResults.perfStats.end,
                startTime: suiteResults.perfStats.start,
                testFilename,
                // Calling this testName is a bit misleading, but we have tooling that's looking for this tag
                testName: testFilename,
                runId: runId,
                executionId: executionId,
            }
            logger.info('Test Case Results', formatted)
        }
    }
}
