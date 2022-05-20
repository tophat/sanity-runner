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

export type AlertContext = {
    testName: string
    message: string
    errorMessage: string | null | undefined
    variables: Partial<Record<string, string>>
    manualSteps: string
    runBook: string
    fullstoryUrl: string | null | undefined
    runId: string
    attachments: { screenShots: Array<string> }
}
