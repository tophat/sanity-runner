import { parse } from 'jest-docblock'

import { logger } from '../logger'

import { resolvePagerDutyAlert, sendPagerDutyAlert } from './pagerDuty'
import { sendSlackMessage } from './slack'
import { constructMessage } from './utils'

import type { EnhancedAggregatedResult, TestMetadata } from '../types'

export async function alertOnResult({
    testFiles,
    results,
    testVariables,
    runId,
}: {
    testFiles: Record<string, string>
    results: EnhancedAggregatedResult
    testVariables: Partial<Record<string, string>>
    runId: string
}) {
    const isFailure = results.numFailedTests > 0

    if (isFailure) {
        for (const [testFile, testContents] of Object.entries(testFiles)) {
            const testMetadata: TestMetadata = parse(testContents)
            const message = await constructMessage({
                results,
                testFile,
                testMetadata,
                testVariables,
                runId,
            })

            const additionalChannels = testVariables.SLACK_CHANNELS?.split(/[ ,]+/) ?? []

            if (testVariables.SLACK_ALERT || testVariables.ALERT) {
                if (testVariables.ALERT) {
                    logger.warn(
                        "The test variable 'ALERT' is deprecated. Please use 'SLACK_ALERT' instead.",
                    )
                }
                await sendSlackMessage({
                    message,
                    testMetadata,
                    additionalChannels,
                    testResults: results,
                })
            }

            if (testVariables.PAGERDUTY_ALERT) {
                await sendPagerDutyAlert({ message, testMetadata })
            }
        }
    } else {
        if (testVariables.PAGERDUTY_ALERT) {
            for (const [testFile, testContents] of Object.entries(testFiles)) {
                const testMetadata: TestMetadata = parse(testContents)
                await resolvePagerDutyAlert({ testFile, testMetadata })
            }
        }
    }
}
