import PagerDutyClient from 'node-pagerduty'

import { getSecretValue } from '../secrets'

import type { AlertMessage, TestMetadata } from '../types'

export async function resolvePagerDutyAlert({
    testFile,
    testMetadata,
}: {
    testFile: string
    testMetadata: TestMetadata
}) {
    try {
        const pd = new PagerDutyClient()
        if (!testMetadata.Pagerduty) {
            console.log(
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
            dedup_key: testFile,
            event_action: 'resolve' as const,
        }
        await pd.events.sendEvent(pl)
    } catch (err) {
        console.error(err)
    }
}

export async function sendPagerDutyAlert({
    message,
    testMetadata,
}: {
    message: AlertMessage
    testMetadata: TestMetadata
}) {
    try {
        const pd = new PagerDutyClient()
        if (!testMetadata.Pagerduty) {
            console.log(
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

        const screenShotAttachments = [...message.attachments.screenShots.map((src) => ({ src }))]
        const screenShotUrls = [...message.attachments.screenShots]

        const pl = {
            routing_key: pgIntegrationId.toString(),
            dedup_key: message.testName,
            event_action: 'trigger' as const,
            images: screenShotAttachments,
            payload: {
                summary: message.message,
                source: 'Sanity Runner',
                severity: 'critical',
                custom_details: {
                    errorMessage: message.errorMessage,
                    manualSteps: message.manualSteps,
                    s3ImageLinks: screenShotUrls.join(', '),
                },
            },
        }

        await pd.events.sendEvent(pl)
    } catch (err) {
        console.error(err)
    }
}
