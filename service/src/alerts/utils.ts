import { logger } from '../logger'

import { getFullStoryUrl } from './fullstory'

import type { AlertMessage, EnhancedAggregatedResult, TestMetadata } from '../types'

export const constructMessage = async function ({
    results,
    testFile,
    testMetadata,
    testVariables,
}: {
    results: EnhancedAggregatedResult
    testFile: string
    testMetadata: TestMetadata
    testVariables: Partial<Record<string, string>>
}): Promise<AlertMessage> {
    const appEnv = testVariables.APP_ENV || '!APP_ENV not supplied!'
    const testResults = results.testResults[0]

    // Messages
    const mainMessage = `Sanity... \`${testFile}\` has failed in \`${appEnv}\`!`
    const errorMessage = testResults.failureMessage

    //log to lambda for debugging
    logger.info('Test Error Message', errorMessage)

    //Attachments
    const screenShots: Array<string> = []
    if (results.screenshots) {
        screenShots.push(
            ...Object.values(results.screenshots).filter((v): v is string => Boolean(v)),
        )
    }
    logger.info('Test Metadata', testMetadata)
    const manualSteps = testMetadata.Description?.replace(/ - /gi, '\n- ') ?? ''
    const runBook = testMetadata?.Runbook ?? ''

    let fullStoryMessage = null
    if (testVariables?.FULLSTORY_ENABLED === 'true') {
        fullStoryMessage = `FullStory URL: ${await getFullStoryUrl()}`
    }
    const message = {
        testName: testFile,
        message: mainMessage,
        errorMessage: errorMessage,
        variables: testVariables,
        manualSteps: manualSteps,
        runBook: runBook,
        fullStoryMessage: fullStoryMessage,
        attachments: {
            screenShots: screenShots,
        },
    }

    return message
}
