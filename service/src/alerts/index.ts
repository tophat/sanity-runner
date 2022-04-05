import { parse } from 'jest-docblock'

import { resolvePagerDutyAlert, sendPagerDutyAlert } from './pagerDuty'
import { sendSlackMessage } from './slack'
import { constructMessage } from './utils'

import type { EnhancedAggregatedResult, TestMetadata } from '../types'

export async function alertOnResult({
    testFiles,
    results,
    testVariables,
}: {
    testFiles: Record<string, string>
    results: EnhancedAggregatedResult
    testVariables: Partial<Record<string, string>>
}) {
    console.log('[alertOnResult]')
    const isFailure = results.numFailedTests > 0
    console.log(`[alertOnResult] isFailure: ${isFailure}`)

    if (isFailure) {
        for (const [testFile, testContents] of Object.entries(testFiles)) {
            console.log(`[alertOnResult] Parsing testFile: ${testFile}`)
            const testMetadata: TestMetadata = parse(testContents)

            console.log('[alertOnResult] Metadata', testMetadata)

            const message = await constructMessage({
                results,
                testFile,
                testMetadata,
                testVariables,
            })

            console.log('[alertOnResult] Message created')
            console.log(
                '[alertOnResult] Message contents',
                JSON.stringify({
                    testName: message.testName,
                    variables: message.variables,
                }),
            )

            const additionalChannels = testVariables.SLACK_CHANNELS?.split(/[ ,]+/) ?? []

            console.log(`[alertOnResult] Variables: ${JSON.stringify(testVariables)}`)

            if (testVariables.SLACK_ALERT || testVariables.ALERT) {
                if (testVariables.ALERT) {
                    console.warn(
                        "The test variable 'ALERT' is deprecated. Please use 'SLACK_ALERT' instead.",
                    )
                }
                await sendSlackMessage({ message, testMetadata, additionalChannels })
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
