import fs from 'fs'
import path from 'path'

import AWS from 'aws-sdk'

import type { EnhancedAggregatedResult } from '../types'
import type { Context, Reporter, ReporterOnStartOptions, Test, TestResult } from '@jest/reporters'
import type { AggregatedResult } from '@jest/test-result'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid')

const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

type ScreenshotReporterOptions = {
    bucket: string
    urlExpirySeconds: number
    filename?: string
    output: string
}

export default class PuppeteerScreenshotReporter implements Reporter {
    #options: ScreenshotReporterOptions

    constructor(_: any, options: ScreenshotReporterOptions) {
        this.#options = options
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onRunStart(_results: AggregatedResult, _options: ReporterOnStartOptions) {
        return
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onRunComplete(_contexts: Set<Context>, _results: AggregatedResult) {
        return
    }

    getLastError(): void | Error {
        return
    }

    async uploadScreenshotToS3(screenshot: string) {
        const screenshotObjectName = `${uuidv4()}.png`
        await s3
            .putObject({
                Body: fs.createReadStream(screenshot),
                Bucket: this.#options.bucket,
                Key: screenshotObjectName,
            })
            .promise()
        return s3.getSignedUrl('getObject', {
            Bucket: this.#options.bucket,
            Key: screenshotObjectName,
            Expires: this.#options.urlExpirySeconds,
        })
    }

    async onTestResult(_test: Test, testResult: TestResult, aggregatedResult: AggregatedResult) {
        const enhancedResults = aggregatedResult as EnhancedAggregatedResult

        for (const result of testResult.testResults) {
            const relativePath = path.join(
                result.fullName,
                this.#options.filename || 'screenshot.png',
            )
            const screenshot = path.join(this.#options.output, relativePath)
            if (result.status === 'failed' && this.#options.bucket) {
                const downloadLink = await this.uploadScreenshotToS3(screenshot)

                result.failureMessages.push(`Screenshot available at ${relativePath}`)
                enhancedResults.screenshots ??= {}
                enhancedResults.screenshots[relativePath] = downloadLink
            }
            try {
                await fs.promises.unlink(screenshot)
            } catch {}
        }
    }
}
