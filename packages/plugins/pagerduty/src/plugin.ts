import PagerDutyClient from 'node-pagerduty'

import type { OnTestCompleteContext, TestMetadata } from '@tophat/sanity-runner-types'

interface PagerDutyTestMetadata extends TestMetadata {
    Pagerduty?: string
}

export const PluginInternals = async ({
    logger,
    getSecretValue,
    testMetadata,
    testFilename,
    testVariables,
    failureMessage,
    results,
    attempt,
    maxAttempts,
}: OnTestCompleteContext<PagerDutyTestMetadata>): Promise<void> => {
    if (!testVariables.PAGERDUTY_ALERT) return

    const appEnv = testVariables.APP_ENV

    //Attachments
    const screenshots: Array<string> = []
    if (results.screenshots) {
        screenshots.push(
            ...Object.values(results.screenshots).filter((v): v is string => Boolean(v)),
        )
    }
    logger.info('Test Metadata', testMetadata)
    const manualSteps = testMetadata.Description?.replace(/ - /gi, '\n- ') ?? ''

    async function resolvePagerDutyAlert() {
        try {
            const pd = new PagerDutyClient()
            if (!testMetadata.Pagerduty) {
                logger.info(
                    'Unable to send Pagerduty alert: no Pagerduty Integration Id supplied in test Metadata',
                )
                return
            }
            const pagerDutySecret = await getSecretValue(`sanity_runner/${testMetadata.Pagerduty}`)
            if (!pagerDutySecret || !('integration_key' in pagerDutySecret)) {
                throw new Error(
                    `Secret sanity_runner/${testMetadata.Pagerduty} not found in AWS Secret Manager!`,
                )
            }
            const pgIntegrationId = pagerDutySecret.integration_key

            const pl = {
                routing_key: pgIntegrationId.toString(),
                dedup_key: testFilename,
                event_action: 'resolve' as const,
            }
            await pd.events.sendEvent(pl)
        } catch (err) {
            logger.error('Unable to resolve PagerDuty alert.', err)
        }
    }

    async function sendPagerDutyAlert() {
        try {
            const pd = new PagerDutyClient()
            if (!testMetadata.Pagerduty) {
                logger.info(
                    'Unable to send Pagerduty alert: no Pagerduty Integration Id supplied in test Metadata',
                )
                return
            }
            const pagerDutySecret = await getSecretValue(`sanity_runner/${testMetadata.Pagerduty}`)
            if (!pagerDutySecret || !('integration_key' in pagerDutySecret)) {
                throw new Error(
                    `Secret sanity_runner/${testMetadata.Pagerduty} not found in AWS Secret Manager!`,
                )
            }
            const pgIntegrationId = pagerDutySecret.integration_key

            const screenShotAttachments = [...screenshots.map((src) => ({ src }))]
            const screenShotUrls = [...screenshots]

            const pl = {
                routing_key: pgIntegrationId.toString(),
                dedup_key: testFilename,
                event_action: 'trigger' as const,
                images: screenShotAttachments,
                payload: {
                    summary: `Sanity... \`${testFilename}\` has failed in \`${appEnv}\`!`,
                    source: 'Sanity Runner',
                    severity: 'critical',
                    custom_details: {
                        errorMessage: failureMessage,
                        manualSteps: manualSteps,
                        s3ImageLinks: screenShotUrls.join(', '),
                    },
                },
            }

            await pd.events.sendEvent(pl)
        } catch (err) {
            logger.error('Unable to send PagerDuty alert.', err)
        }
    }

    if (results.passed) {
        await resolvePagerDutyAlert()
    } else {
        if (attempt + 1 < maxAttempts) {
            // There's still another attempt.
            return
        }

        await sendPagerDutyAlert()
    }
}
