import path from 'path'

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
}: {
    results: AggregatedResult
    testVariables: Record<string, unknown>
    retryCount: number
    runId: string
    executionId: string
}) {
    for (const suiteResults of results.testResults) {
        for (const testCaseResults of suiteResults.testResults) {
            const fileName = path.basename(suiteResults.testFilePath)
            const testName = fileName.substring(0, fileName.lastIndexOf('.'))
            const formatted = {
                variables: testVariables,
                retryCount: retryCount,
                duration: testCaseResults.duration ? testCaseResults.duration / 1000 : null,
                status: suiteResults.numPendingTests > 0 ? 'skipped' : testCaseResults.status,
                endTime: suiteResults.perfStats.end,
                startTime: suiteResults.perfStats.start,
                testName,
                runId: runId,
                executionId: executionId,
            }
            logger.info('Test Case Results', formatted)
        }
    }
}
