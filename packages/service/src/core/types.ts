import type {
    DefaultViewport,
    PluginHooks,
    TestMetadata,
    TestVariables,
} from '@tophat/sanity-runner-types'

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

export type RunTestContext = {
    testFilename: string
    testCode: string
    testVariables: TestVariables
    /**
     * Uniquely identifies a single invocation of the service for a single test.
     */
    runId: string
    /**
     * The execution ID is a UUID which identifies the invocation of the Sanity Runner client.
     * All tests will receive the same execution ID, though each test case itself will also have
     * a "run id".
     */
    executionId: string
    hooks: PluginHooks
    testMetadata: TestMetadata
    defaultViewport: DefaultViewport
    /** @deprecated Retries now occur on the client. */
    maxRetryCount?: number
    /** The current attempt, 0-index based. */
    attempt: number
    /**
     * The maximum number of attempts. The service only runs the test once,
     * but if maxAttempts > attempt, then on failure we know that the client
     * will retry.
     */
    maxAttempts: number
}
