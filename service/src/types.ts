import { AggregatedResult } from '@jest/test-result'

export type EnhancedAggregatedResult = AggregatedResult & {
    screenshots: Partial<Record<string, string>>
}

export type TestMetadata = {
    Description?: string
    Runbook?: string
    Pagerduty?: string
    Slack?: string
    SlackHandler?: string
}

export type AlertMessage = {
    testName: string
    message: string
    errorMessage: string | null | undefined
    variables: Partial<Record<string, string>>
    manualSteps: string
    runBook: string
    fullStoryMessage: string | null
    runId: string
    attachments: { screenShots: Array<string> }
}
