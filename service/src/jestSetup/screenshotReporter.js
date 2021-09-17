const fs = require('fs-extra')
const path = require('path')
const AWS = require('aws-sdk')
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

class PuppeteerScreenshotReporter {
    constructor(globalConfig, options) {
        this._globalConfig = globalConfig
        this._options = options
    }

    async uploadScreenshotToS3(screenshot) {
        const screenshotObjectName = `${uuidv4()}.png`
        await s3
            .putObject({
                Body: fs.createReadStream(screenshot),
                Bucket: this._options.bucket,
                Key: screenshotObjectName,
            })
            .promise()
        return s3.getSignedUrl('getObject', {
            Bucket: this._options.bucket,
            Key: screenshotObjectName,
            Expires: this._options.urlExpirySeconds,
        })
    }

    async onTestResult(test, testResult, aggregatedResult) {
        for (const result of testResult.testResults) {
            const relativePath = path.join(
                result.fullName,
                this._options.filename || 'screenshot.png',
            )
            const screenshot = path.join(this._options.output, relativePath)
            if (result.status === 'failed') {
                const downloadLink = await this.uploadScreenshotToS3(screenshot)

                result.failureMessages.push(
                    `Screenshot available at ${relativePath}`,
                )
                if (!aggregatedResult.screenshots)
                    aggregatedResult.screenshots = {}
                aggregatedResult.screenshots[relativePath] = downloadLink
            }
            fs.remove(screenshot)
        }
    }
}

module.exports = PuppeteerScreenshotReporter
