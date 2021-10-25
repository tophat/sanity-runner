const { parse } = require('jest-docblock')
const { WebClient } = require('@slack/web-api')
const pdClient = require('node-pagerduty')
const fs = require('fs-extra')

const secretmanager = require('./secrets')

const getFullStoryUrl = async function () {
    try {
        const fullStoryUrl = fs.readFileSync('/tmp/fullStoryUrl.txt', 'utf8')
        fs.remove('/tmp/fullStoryUrl.txt')
        return fullStoryUrl
    } catch (e) {
        return 'ERROR: No FullStory URL found.'
    }
}

const resolvePagerDutyAlert = async function (testFile, testMetaData) {
    try {
        const pd = new pdClient()
        if (!testMetaData.Pagerduty) {
            console.log(
                'Unable to send Pagerduty alert: no Pagerduty Integration Id supplied in test Metadata',
            )
            return
        }
        const pagerDutySecret = await secretmanager.getSecretValue(
            `sanity_runner/${testMetaData.Pagerduty}`,
        )
        if (
            !Object.prototype.hasOwnProperty.call(
                pagerDutySecret,
                'integration_key',
            )
        ) {
            throw new Error(
                `Secret sanity_runner/${testMetaData.Pagerduty} not found in AWS Secret Manager!`,
            )
        }
        const pgIntegrationId = pagerDutySecret.integration_key

        const pl = {
            routing_key: pgIntegrationId.toString(),
            dedup_key: testFile,
            event_action: 'resolve',
        }
        await pd.events.sendEvent(pl)
    } catch (err) {
        console.error(err)
    }
}

const sendPagerDutyAlert = async function (message, testMetaData) {
    try {
        const pd = new pdClient()
        if (!testMetaData.Pagerduty) {
            console.log(
                'Unable to send Pagerduty alert: no Pagerduty Integration Id supplied in test Metadata',
            )
            return
        }
        const pagerDutySecret = await secretmanager.getSecretValue(
            `sanity_runner/${testMetaData.Pagerduty}`,
        )
        if (
            !Object.prototype.hasOwnProperty.call(
                pagerDutySecret,
                'integration_key',
            )
        ) {
            throw new Error(
                `Secret sanity_runner/${testMetaData.Pagerduty} not found in AWS Secret Manager!`,
            )
        }
        const pgIntegrationId = pagerDutySecret.integration_key

        const screenShotAttachments = []
        const screenShotUrls = []
        for (const screenshotTitle of Object.keys(
            message.attachments.screenShots,
        )) {
            screenShotAttachments.push({
                src: message.attachments.screenShots[screenshotTitle],
            })
            screenShotUrls.push(
                message.attachments.screenShots[screenshotTitle],
            )
        }

        const pl = {
            routing_key: pgIntegrationId.toString(),
            dedup_key: message.testName,
            event_action: 'trigger',
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

const sendSlackMessage = async function (
    message,
    testMetaData,
    additionalChannels,
) {
    try {
        const slackToken = await secretmanager.getSecretValue(
            'sanity_runner/slack_api_token',
        )
        if (
            !Object.prototype.hasOwnProperty.call(slackToken, 'slack_api_token')
        ) {
            throw new Error(
                'Secret sanity_runner/slack_api_token not found in AWS Secret Manager!',
            )
        }
        const slack = new WebClient(slackToken.slack_api_token)
        let slackChannels =
            testMetaData.Slack.split(/[ ,]+/).concat(additionalChannels)
        // Remove duplicates
        slackChannels = [...new Set(slackChannels)]

        const slackMessage = testMetaData.SlackHandler
            ? `${testMetaData.SlackHandler} ${message.message}`
            : message.message

        const screenShotAttachments = []
        const screenShotUrls = []
        for (const screenshotTitle of Object.keys(
            message.attachments.screenShots,
        )) {
            screenShotAttachments.push({
                title: screenshotTitle,
                image_url: message.attachments.screenShots[screenshotTitle],
                color: '#D40E0D',
            })
            screenShotUrls.push(
                message.attachments.screenShots[screenshotTitle].split(
                    'AWSAccessKeyId',
                )[0],
            )
        }
        const screenshotMessage = `Attached Screenshot at time of error. Screenshot s3 URL(s): ${screenShotUrls.join(
            ', ',
        )}`

        // Send Slack message and format into thread
        await Promise.all(
            slackChannels.map(async (slackChannel) => {
                const slackThreadTs = slackChannel.split(':')
                const channel = slackThreadTs[0]
                let thread =
                    slackThreadTs.length === 2 ? slackThreadTs[1] : null

                const resParent = await slack.chat.postMessage({
                    channel: channel,
                    thread_ts: thread,
                    text: slackMessage,
                    link_names: true,
                })
                thread = thread ? thread : resParent.ts
                await slack.chat.postMessage({
                    channel: channel,
                    thread_ts: thread,
                    text: screenshotMessage,
                    attachments: screenShotAttachments,
                })

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
                            text: message.errorMessage,
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
        console.error(err)
    }
}

const constructMessage = async function (
    results,
    test,
    testMetaData,
    testVariables,
) {
    const appEnv = testVariables.APP_ENV || '!APP_ENV not supplied!'
    const testResults = results.testResults[0]

    // Messages
    const mainMessage = `Sanity... \`${test}\` has failed in \`${appEnv}\`!`
    const errorMessage = testResults.message

    //log to lambda for debugging
    console.log(errorMessage)

    //Attachments
    const screenShots = []
    if (results.screenshots) {
        for (const screenshotTitle of Object.keys(results.screenshots)) {
            screenShots.push(results.screenshots[screenshotTitle])
        }
    }
    console.log(testMetaData)
    const manualSteps = testMetaData.Description
        ? testMetaData.Description.replace(/ - /gi, '\n- ')
        : ''

    const runBook = testMetaData.Runbook ? testMetaData.Runbook : ''

    let fullStoryMessage = null
    if (
        Object.prototype.hasOwnProperty.call(testVariables, 'FULLSTORY_ENABLED')
    ) {
        if (testVariables.FULLSTORY_ENABLED === 'true') {
            fullStoryMessage = `FullStory URL: ${await getFullStoryUrl()}`
        }
    }
    const message = {
        testName: test,
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
module.exports = async function (testFiles, results, testVariables) {
    if (results.numFailedTests > 0) {
        for (const testFile of Object.keys(testFiles)) {
            const testContents = testFiles[testFile]
            const testMetaData = parse(testContents)
            const message = await constructMessage(
                results,
                testFile,
                testMetaData,
                testVariables,
            )
            console.log('here')

            const additionalChannels = Object.prototype.hasOwnProperty.call(
                testVariables,
                'SLACK_CHANNELS',
            )
                ? testVariables.SLACK_CHANNELS.split(/[ ,]+/)
                : []

            if (
                Object.prototype.hasOwnProperty.call(
                    testVariables,
                    'SLACK_ALERT',
                )
            ) {
                if (testVariables.SLACK_ALERT) {
                    await sendSlackMessage(
                        message,
                        testMetaData,
                        additionalChannels,
                    )
                }
            } else if (
                Object.prototype.hasOwnProperty.call(testVariables, 'ALERT')
            ) {
                // Will delete eventually, but ensures no one using previous ENV will have their alerts break
                if (testVariables.ALERT) {
                    await sendSlackMessage(
                        message,
                        testMetaData,
                        additionalChannels,
                    )
                }
            }
            if (
                Object.prototype.hasOwnProperty.call(
                    testVariables,
                    'PAGERDUTY_ALERT',
                )
            ) {
                if (testVariables.PAGERDUTY_ALERT) {
                    await sendPagerDutyAlert(message, testMetaData)
                }
            }
        }
    } else if (results.numFailedTests === 0) {
        if (
            Object.prototype.hasOwnProperty.call(
                testVariables,
                'PAGERDUTY_ALERT',
            )
        ) {
            for (const testFile of Object.keys(testFiles)) {
                const testContents = testFiles[testFile]
                const testMetaData = parse(testContents)
                if (testVariables.PAGERDUTY_ALERT) {
                    await resolvePagerDutyAlert(testFile, testMetaData)
                }
            }
        }
    }
}
