import { AggregatedResult } from '@jest/test-result'

import type { ReportScreenshots, TestVariables } from '@tophat/sanity-runner-types'

export type EnhancedAggregatedResult = AggregatedResult & {
    screenshots: ReportScreenshots
}

export type TestMetadata = {
    Description?: string
    Runbook?: string
    Pagerduty?: string
    Slack?: string
    SlackHandler?: string
}

export type AlertContext = {
    testName: string
    message: string
    errorMessage: string | null | undefined
    variables: TestVariables
    manualSteps: string
    runBook: string
    fullstoryUrl: string | null | undefined
    runId: string
    attachments: { screenShots: Array<string> }
}
