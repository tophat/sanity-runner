const { parse } = require('jest-docblock')
const { WebClient } = require('@slack/web-api')
const secretmanager = require('./secrets')
const pdClient = require('node-pagerduty')

const resolvePagerDutyAlert = async function(testFile, testMetaData) {
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
        if (!pagerDutySecret.hasOwnProperty('integration_key')) {
            throw new Error(
                `Secret sanity_runner/${
                    testMetaData.Pagerduty
                } not found in AWS Secret Manager!`,
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

const sendPagerDutyAlert = async function(message, testMetaData) {
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
        if (!pagerDutySecret.hasOwnProperty('integration_key')) {
            throw new Error(
                `Secret sanity_runner/${
                    testMetaData.Pagerduty
                } not found in AWS Secret Manager!`,
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

const sendSlackMessage = async function(message, testMetaData) {
    try {
        const slackToken = await secretmanager.getSecretValue(
            'sanity_runner/slack_api_token',
        )
        if (!slackToken.hasOwnProperty('slack_api_token')) {
            throw new Error(
                `Secret sanity_runner/slack_api_token not found in AWS Secret Manager!`,
            )
        }
        const slack = new WebClient(slackToken.slack_api_token)
        const slackChannel = testMetaData.Slack
        const slackMessage = testMetaData.SlackHandler
            ? `${testMetaData.SlackHandler} ${message.message}`
            : message.message

        // Send Slack message and format into thread
        const resParent = await slack.chat.postMessage({
            channel: slackChannel,
            text: slackMessage,
            link_names: true,
        })

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
        await slack.chat.postMessage({
            channel: slackChannel,
            thread_ts: resParent.ts,
            text: screenshotMessage,
            attachments: screenShotAttachments,
        })

        await slack.chat.postMessage({
            channel: slackChannel,
            thread_ts: resParent.ts,
            attachments: [
                {
                    title: 'Error Message',
                    text: message.errorMessage,
                    color: '#D40E0D',
                },
            ],
        })

        await slack.chat.postMessage({
            channel: slackChannel,
            thread_ts: resParent.ts,
            attachments: [
                {
                    title: 'Variables used by given test',
                    text: JSON.stringify(message.variables),
                },
            ],
        })

        if (message.runBook) {
            await slack.chat.postMessage({
                channel: slackChannel,
                thread_ts: resParent.ts,
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
            channel: slackChannel,
            thread_ts: resParent.ts,
            attachments: [
                {
                    title: 'Manual Steps for Sanity',
                    text: message.manualSteps.replace(/ - /gi, '\n- '),
                },
            ],
        })
    } catch (err) {
        console.error(err)
    }
}

const constructMessage = async function(
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
    console.log("HERERERE")
    console.log(results.screenshots)
    if(results.screenshots){
        for (const screenshotTitle of Object.keys(results.screenshots)) {
            console.log("asdasd")
            screenShots.push(results.screenshots[screenshotTitle])
        }
    }
    console.log(testMetaData)
    const manualSteps = testMetaData.Description
        ? testMetaData.Description.replace(/ - /gi, '\n- ')
        : ''

    const runBook = testMetaData.Runbook ? testMetaData.Runbook : ''

    const message = {
        testName: test,
        message: mainMessage,
        errorMessage: errorMessage,
        variables: testVariables,
        manualSteps: manualSteps,
        runBook: runBook,
        attachments: {
            screenShots: screenShots,
        },
    }

    return message
}
module.exports = async function(testFiles, results, testVariables) {
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
            if (testVariables.hasOwnProperty('SLACK_ALERT')) {
                if (testVariables.SLACK_ALERT) {
                    await sendSlackMessage(message, testMetaData)
                }
            } else if (testVariables.hasOwnProperty('ALERT')) {
                // Will delete eventually, but ensures no one using previous ENV will have their alerts break
                if (testVariables.ALERT) {
                    await sendSlackMessage(message, testMetaData)
                }
            }
            if (testVariables.hasOwnProperty('PAGERDUTY_ALERT')) {
                if (testVariables.PAGERDUTY_ALERT) {
                    await sendPagerDutyAlert(message, testMetaData)
                }
            }
        }
    } else if (results.numFailedTests === 0) {
        if (testVariables.hasOwnProperty('PAGERDUTY_ALERT')) {
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
