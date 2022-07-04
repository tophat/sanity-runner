import type { TestVariables } from '@tophat/sanity-runner-types'

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
