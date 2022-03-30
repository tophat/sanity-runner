import fs from 'fs'
import path from 'path'

import paths from './paths'
import { EnhancedAggregatedResult } from './types'

import type { Config } from '@jest/types'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid')

/*
 * Runtime initialization errors are not currently reported by junit reporter
 * https://github.com/jest-community/jest-junit/pull/47
 */
const extractRuntimeErrors = function (results: EnhancedAggregatedResult) {
    const errors = []
    if (results.numRuntimeErrorTestSuites > 0) {
        for (const testSuite of results.testResults) {
            if (testSuite.testExecError) {
                errors.push({
                    message: testSuite.testExecError.message,
                    name: testSuite.displayName,
                })
            }
        }
    }
    return errors
}

export default class Run {
    id: string
    variables: Record<string, unknown>

    constructor(variables: Record<string, unknown>) {
        this.id = uuidv4()
        this.variables = variables
    }

    async cleanup() {
        await fs.promises.rm(paths.run(this.id), { recursive: true })
    }

    jestConfig(): Config.InitialOptions {
        return {
            bail: false,
            globalSetup: path.resolve(__dirname, 'jestConfig/puppeteerSetup.js'),
            globalTeardown: path.resolve(__dirname, 'jestConfig/puppeteerTeardown.js'),
            globals: {
                lambdaContext: {
                    sanityRequestId: this.id,
                },
                SANITY_VARIABLES: this.variables || {},
                SCREENSHOT_OUTPUT: paths.results(this.id),
            },
            notify: false,
            reporters: [
                'default',
                [
                    'jest-junit',
                    {
                        outputDirectory: paths.results(this.id),
                        outputName: paths.junitFileName(this.id),
                    },
                ],
                [
                    path.resolve(__dirname, 'jestConfig/screenshotReporter.js'),
                    {
                        output: paths.results(this.id),
                        urlExpirySeconds: 7200,
                        bucket: process.env.SCREENSHOT_BUCKET,
                    },
                ],
            ],
            resetMocks: false,
            resetModules: false,
            roots: [paths.suite(this.id)],
            rootDir: process.cwd(),
            setupFilesAfterEnv: [path.resolve(__dirname, 'jestConfig/e2eFrameworkSetup.js')],
            testEnvironment: path.resolve(__dirname, 'jestConfig/puppeteerEnvironment.js'),
            timers: 'real',
            verbose: true,
        }
    }

    async writeSuites(testFiles: Record<string, string>) {
        await fs.promises.mkdir(paths.results(this.id), { recursive: true })

        const destination = paths.suite(this.id)
        await fs.promises.mkdir(destination, { recursive: true })

        await Promise.all(
            Object.entries(testFiles).map(async ([filename, content]) => {
                const filepath = path.join(destination, filename)
                await fs.promises.mkdir(path.dirname(filepath), { recursive: true })
                await fs.promises.writeFile(filepath, content, 'utf-8')
            }),
        )
    }

    async format(results: EnhancedAggregatedResult) {
        const junitContents = await fs.promises.readFile(paths.junit(this.id), 'utf-8')
        return {
            passed: results.success,
            screenshots: results.screenshots,
            errors: extractRuntimeErrors(results),
            testResults: {
                [paths.junitFileName(this.id)]: junitContents,
            },
        }
    }
}
