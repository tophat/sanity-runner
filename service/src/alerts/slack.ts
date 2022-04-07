import { WebClient } from '@slack/web-api'

import { logger } from '../logger'
import { getSecretValue } from '../secrets'

import type { AlertMessage, TestMetadata } from '../types'

export async function sendSlackMessage({
    message,
    testMetadata,
    additionalChannels,
}: {
    message: AlertMessage
    testMetadata: TestMetadata
    additionalChannels: Array<string>
}) {
    try {
        const slackToken = await getSecretValue('sanity_runner/slack_api_token')
        if (!slackToken || !('slack_api_token' in slackToken)) {
            throw new Error('Secret sanity_runner/slack_api_token not found in AWS Secret Manager!')
        }
        const slack = new WebClient(slackToken.slack_api_token)
        const slackChannels = [
            ...new Set([...(testMetadata.Slack?.split(/[ ,]+/) ?? []), ...additionalChannels]),
        ]

        const slackMessage = testMetadata.SlackHandler
            ? `${testMetadata.SlackHandler} ${message.message}`
            : message.message

        const screenShotAttachments: Array<{
            title: string
            image_url: string
            color: string
        }> = [
            ...message.attachments.screenShots.map((image_url) => ({
                title: message.testName,
                image_url,
                color: '#D40E0D',
            })),
        ]
        const screenShotUrls = [
            ...message.attachments.screenShots.map((url) => url.split('AWSAccessKeyId')[0]),
        ]

        const screenshotMessage = `Attached Screenshot at time of error. Screenshot s3 URL(s): ${screenShotUrls.join(
            ', ',
        )}`

        // Send Slack message and format into thread
        await Promise.all(
            slackChannels.map(async (slackChannel: string) => {
                const slackThreadTs = slackChannel.split(':')
                const channel = slackThreadTs[0]
                let thread = slackThreadTs.length === 2 ? slackThreadTs[1] : undefined

                const resParent = await slack.chat.postMessage({
                    channel: channel,
                    thread_ts: thread,
                    text: slackMessage,
                    link_names: true,
                })
                thread = thread ? thread : resParent.ts
                if (screenShotUrls.length || screenShotAttachments.length) {
                    await slack.chat.postMessage({
                        channel: channel,
                        thread_ts: thread,
                        text: screenshotMessage,
                        attachments: screenShotAttachments,
                    })
                }

                if (message.fullStoryMessage) {
                    await slack.chat.postMessage({
                        channel: channel,
                        thread_ts: thread,
                        text: message.fullStoryMessage,
                    })
                }

                await slack.chat.postMessage({
                    channel: channel,
                    thread_ts: thread,
                    attachments: [
                        {
                            title: 'Error Message',
                            text: message.errorMessage ?? undefined,
                            color: '#D40E0D',
                        },
                    ],
                })

                await slack.chat.postMessage({
                    channel: channel,
                    thread_ts: thread,
                    attachments: [
                        {
                            title: 'Variables used by given test',
                            text: JSON.stringify(message.variables),
                        },
                    ],
                })

                if (message.runBook) {
                    await slack.chat.postMessage({
                        channel: channel,
                        thread_ts: thread,
                        attachments: [
                            {
                                title: 'Runbook to follow',
                                text: message.runBook,
                            },
                        ],
                    })
                }

                // jest-docblock does not support multiline strings and seperates them with spaces.
                // We enforce a standard of "-" surronded by spaces as the standard practice for making
                // a new line in the description of a test.
                await slack.chat.postMessage({
                    channel: channel,
                    thread_ts: thread,
                    attachments: [
                        {
                            title: 'Manual Steps for Sanity',
                            text: message.manualSteps.replace(/ - /gi, '\n- '),
                        },
                    ],
                })
            }),
        )
    } catch (err) {
        logger.error('Failure sending Slack message.', err)
    }
}
