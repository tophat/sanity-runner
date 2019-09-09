const { parse } = require('jest-docblock')
const { WebClient } = require('@slack/web-api')
const secretmanager = require('./secrets')

const sendSlackMessage = async function(
    results,
    test,
    testMetaData,
    testVariables,
) {
    try {
        const slackToken = await secretmanager.getSecretValue(
            'sanity_runner/slack_api_token',
        )
        if (!slackToken.hasOwnProperty('slack_api_token')) {
            console.log('Slack Token was not retrieved')
            return 1
        }
        const slack = new WebClient(slackToken.slack_api_token)
        const slackChannel = testMetaData.Slack

        const testResults = results.testResults[0]

        //obtain all screen shots
        const screenShotAttachment = []
        for (const screenshotTitle of Object.keys(results.screenshots)) {
            screenShotAttachment.push({
                title: screenshotTitle,
                image_url: results.screenshots[screenshotTitle],
                color: '#D40E0D',
            })
        }

        // Send Slack message and format into thread
        const parentMessage = `Sanity... \`${test}\` has Failed!`
        const resParent = await slack.chat.postMessage({
            channel: slackChannel,
            text: parentMessage,
            attachments: screenShotAttachment,
        })

        const errorMessage = `\`\`\`${testResults.message}\`\`\``
        await slack.chat.postMessage({
            channel: slackChannel,
            thread_ts: resParent.ts,
            attachments: [
                {
                    title: 'Error Message',
                    text: errorMessage,
                    color: '#D40E0D',
                },
            ],
        })

        const variablesMessage = JSON.stringify(testVariables)
        await slack.chat.postMessage({
            channel: slackChannel,
            thread_ts: resParent.ts,
            attachments: [
                {
                    title: 'Variables used by given test',
                    text: variablesMessage,
                },
            ],
        })

        const descriptionMessage = testMetaData.Description
        await slack.chat.postMessage({
            channel: slackChannel,
            thread_ts: resParent.ts,
            attachments: [
                {
                    title: 'Manual Steps for Sanity',
                    text: descriptionMessage.replace(/-/gi, '\n- '),
                },
            ],
        })
    } catch (err) {
        console.log(err)
    }
}

module.exports = async function(testFiles, results, testVariables) {
    if (testVariables.hasOwnProperty('ALERT')) {
        if (testVariables.ALERT && results.numFailedTests > 0) {
            for (const testFile of Object.keys(testFiles)) {
                const testContents = testFiles[testFile]
                const testMetaData = parse(testContents)
                await sendSlackMessage(
                    results,
                    testFile,
                    testMetaData,
                    testVariables,
                )
            }
        }
    }
}
