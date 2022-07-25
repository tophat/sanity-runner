import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import type { EnhancedAggregatedResult } from '@tophat/sanity-runner-types'

import type {
    Reporter,
    ReporterOnStartOptions,
    Test,
    TestContext,
    TestResult,
} from '@jest/reporters'
import type { AggregatedResult } from '@jest/test-result'

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
    onRunComplete(_contexts: Set<TestContext>, _results: AggregatedResult) {
        return
    }

    getLastError(): void | Error {
        return
    }

    async uploadScreenshotToS3(screenshot: string) {
        // The bucket option may contain a key prefix in the format: s3-bucket/prefix
        const [bucket, ...prefix] = this.#options.bucket.split('/')
        const key = [...prefix, `${crypto.randomUUID()}.png`].join('/')

        const s3Client = new S3Client({ apiVersion: '2006-03-01' })
        await s3Client.send(
            new PutObjectCommand({
                Key: key,
                Bucket: bucket,
                Body: fs.createReadStream(screenshot),
            }),
        )
        return await getSignedUrl(
            s3Client,
            new GetObjectCommand({
                Bucket: bucket,
                Key: key,
            }),
            // max expiry is 7 days (AWS limitation)
            { expiresIn: Math.min(this.#options.urlExpirySeconds, 7 * 24 * 3600) },
        )
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
