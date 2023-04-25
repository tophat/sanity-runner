import { type KnownBlock, WebClient } from '@slack/web-api'

import type { OnTestCompleteContext, TestMetadata } from '@tophat/sanity-runner-types'

interface SlackTestMetadata extends TestMetadata {
    Slack?: string
    SlackHandler?: string
}

export type PluginOptions = {
    linkFactory?: () => Promise<undefined | null | Array<{ name: string; url: string }>>
}

export const createPluginInternals =
    (options?: PluginOptions) =>
    async ({
        logger,
        getSecretValue,
        testMetadata,
        testDisplayName,
        testFilename,
        testVariables,
        runId,
        failureMessage,
        results,
        attempt,
        maxAttempts,
    }: OnTestCompleteContext<SlackTestMetadata>): Promise<void> => {
        const appEnv = testVariables.APP_ENV
        const additionalChannels = testVariables.SLACK_CHANNELS?.split(/[ ,]+/) ?? []

        if (testVariables.ALERT) {
            logger.warn(
                "The test variable 'ALERT' is deprecated. Please use 'SLACK_ALERT' instead.",
            )
        }

        if (!(testVariables.SLACK_ALERT && !testVariables.ALERT)) {
            // Skip alert
            return
        }

        if (attempt + 1 < maxAttempts) {
            // There's still another attempt.
            return
        }

        //Attachments
        const screenshots: Array<string> = []
        if (results.screenshots) {
            screenshots.push(
                ...Object.values(results.screenshots).filter((v): v is string => Boolean(v)),
            )
        }
        logger.info('Test Metadata', testMetadata)
        const manualSteps = testMetadata.Description?.replace(/ - /gi, '\n- ') ?? ''
        const runBook = testMetadata?.Runbook ?? ''

        try {
            const slackToken = await getSecretValue('sanity_runner/slack_api_token')
            if (!slackToken || !('slack_api_token' in slackToken)) {
                throw new Error(
                    'Secret sanity_runner/slack_api_token not found in AWS Secret Manager!',
                )
            }
            const slack = new WebClient(slackToken.slack_api_token)

            const testSpecificChannels = testMetadata.Slack?.split(/[ ,]+/) ?? []
            const slackChannels = Array.from(
                new Set([...testSpecificChannels, ...additionalChannels]),
            )

            const blocks: Array<KnownBlock> = []

            blocks.push({
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `Sanity Test Failure - *${appEnv ?? 'N/A'}*`,
                    },
                ],
            })

            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Test*: ${testDisplayName}`,
                },
            })

            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `*Filename*: ${testFilename} ${testMetadata.SlackHandler ?? ''}`,
                },
            })

            // jest-docblock does not support multiline strings and seperates them with spaces.
            // We enforce a standard of "-" surronded by spaces as the standard practice for making
            // a new line in the description of a test.
            if (manualSteps) {
                blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text:
                            `*Manual Steps*: ${runBook ? `(<${runBook}|see runbook>)` : ''}` +
                            `\n${manualSteps}`,
                    },
                })
            }

            // taking first lines of stack trace due to Slack character limits (3001 chars)
            // https://api.slack.com/methods/chat.postMessage#formatting
            if (failureMessage) {
                blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Error Message*:\n\n${failureMessage
                            .split('\n')
                            .map((line) => `> ${line}`)
                            .join('\n')
                            .slice(0, 2980)}`,
                    },
                })
            }

            const links: Array<{ name: string; url: string }> = []
            if (options?.linkFactory) {
                links.push(...((await options.linkFactory()) ?? []))
            }

            if (links.length) {
                blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Links*: ${links
                            .map(({ name, url }) => `<${url}|${name}>`)
                            .join(' | ')}`,
                    },
                })
            }

            if (screenshots.length) {
                for (let i = 0; i < screenshots.length; i++) {
                    const screenshotUrl = screenshots[i]
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
                    text: `\`\`\`\n${JSON.stringify(testVariables)}\n\`\`\``,
                },
            })

            blocks.push({ type: 'divider' })
            blocks.push({
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `Run Id: *${runId ?? 'N/A'}*`,
                    },
                ],
            })

            await Promise.all(
                slackChannels.map(async (channelId: string) => {
                    // eslint-disable-next-line prefer-const
                    let [channel, thread] = channelId.split(':')

                    if (!thread) {
                        // We're not posting to a thread, we're posting to a channel. To prevent noise,
                        // we'll post a short summary and then following up with details in the thread.
                        const response = await slack.chat.postMessage({
                            channel,
                            text: `${testFilename} has failed in *${appEnv ?? 'N/A'}*`,
                            link_names: true,
                            blocks: [
                                {
                                    type: 'context',
                                    elements: [
                                        {
                                            type: 'mrkdwn',
                                            text: `Sanity Test Failure - *${appEnv ?? 'N/A'}*`,
                                        },
                                    ],
                                },
                                {
                                    type: 'section',
                                    text: {
                                        type: 'mrkdwn',
                                        text: `\`${testFilename}\` has failed. ${
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
                                fallback: failureMessage ?? 'Unknown error',
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
