import { KnownBlock, WebClient } from '@slack/web-api'

import { logger } from '../logger'
import { getSecretValue } from '../secrets'

import type { AlertContext, EnhancedAggregatedResult, TestMetadata } from '../types'

async function buildMessageBlocks({
    message,
    testMetadata,
    testResults,
}: {
    message: AlertContext
    testMetadata: TestMetadata
    testResults: EnhancedAggregatedResult
}) {
    const result = testResults.testResults[0]
    const blocks: Array<KnownBlock> = []

    blocks.push({
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text: `Sanity Test Failure - *${message.variables.APP_ENV ?? 'N/A'}*`,
            },
        ],
    })

    if (result.displayName) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Test*: ${result.displayName}`,
            },
        })
    }
    blocks.push({
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `*Filename*: ${message.testName} ${testMetadata.SlackHandler ?? ''}`,
        },
    })

    // jest-docblock does not support multiline strings and seperates them with spaces.
    // We enforce a standard of "-" surronded by spaces as the standard practice for making
    // a new line in the description of a test.
    if (message.manualSteps) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text:
                    `*Manual Steps*: ${
                        message.runBook ? `(<${message.runBook}|see runbook>)` : ''
                    }` + `\n${message.manualSteps}`,
            },
        })
    }

    if (message.errorMessage) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Error Message*:\n\n${message.errorMessage
                    .split('\n')
                    .map((line) => `> ${line}`)
                    .join('\n')}`,
            },
        })
    }

    const links: Array<{ name: string; url: string }> = []
    if (message.fullstoryUrl) {
        links.push({ name: 'Fullstory Session', url: message.fullstoryUrl })
    }
    if (links.length) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*Links*: ${links.map(({ name, url }) => `<${url}|${name}>`).join(' | ')}`,
            },
        })
    }

    if (message.attachments.screenShots.length) {
        for (let i = 0; i < message.attachments.screenShots.length; i++) {
            const screenshotUrl = message.attachments.screenShots[i]
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `<${screenshotUrl}|Screenshot #${i + 1}>`,
                },
                accessory: {
                    type: 'image',
                    image_url: screenshotUrl,
                    alt_text: `Screenshot ${i + 1}`,
                },
            })
        }
    }

    blocks.push({
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `\`\`\`\n${JSON.stringify(message.variables)}\n\`\`\``,
        },
    })

    blocks.push({ type: 'divider' })
    blocks.push({
        type: 'context',
        elements: [
            {
                type: 'mrkdwn',
                text: `Run Id: *${message.runId ?? 'N/A'}*`,
            },
        ],
    })

    return blocks
}

export async function sendSlackMessage({
    message,
    testMetadata,
    additionalChannels,
    testResults,
}: {
    message: AlertContext
    testMetadata: TestMetadata
    additionalChannels: Array<string>
    testResults: EnhancedAggregatedResult
}) {
    try {
        const slackToken = await getSecretValue('sanity_runner/slack_api_token')
        if (!slackToken || !('slack_api_token' in slackToken)) {
            throw new Error('Secret sanity_runner/slack_api_token not found in AWS Secret Manager!')
        }

        const slack = new WebClient(slackToken.slack_api_token)

        const testSpecificChannels = testMetadata.Slack?.split(/[ ,]+/) ?? []
        const slackChannels = Array.from(new Set([...testSpecificChannels, ...additionalChannels]))

        const blocks = await buildMessageBlocks({ message, testMetadata, testResults })

        await Promise.all(
            slackChannels.map(async (channelId: string) => {
                // eslint-disable-next-line prefer-const
                let [channel, thread] = channelId.split(':')

                if (!thread) {
                    // We're not posting to a thread, we're posting to a channel. To prevent noise,
                    // we'll post a short summary and then following up with details in the thread.
                    const response = await slack.chat.postMessage({
                        channel,
                        text: `${message.testName} has failed in *${
                            message.variables.APP_ENV ?? 'N/A'
                        }*`,
                        link_names: true,
                        blocks: [
                            {
                                type: 'context',
                                elements: [
                                    {
                                        type: 'mrkdwn',
                                        text: `Sanity Test Failure - *${
                                            message.variables.APP_ENV ?? 'N/A'
                                        }*`,
                                    },
                                ],
                            },
                            {
                                type: 'section',
                                text: {
                                    type: 'mrkdwn',
                                    text: `\`${message.testName}\` has failed. ${
                                        testMetadata.SlackHandler ?? ''
                                    }\n\nSee thread for details.`,
                                },
                            },
                        ],
                    })
                    thread = response.ts!
                }

                await slack.chat.postMessage({
                    channel,
                    thread_ts: thread,
                    attachments: [
                        {
                            color: '#A30201',
                            fallback: message.errorMessage ?? 'Unknown error',
                            blocks,
                        },
                    ],
                })
            }),
        )
    } catch (err) {
        logger.error('Failure sending Slack message.', err)
    }
}
