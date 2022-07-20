import fs from 'fs'
import path from 'path'

import xml2js from 'xml2js'

import type {
    EnhancedAggregatedResult,
    InvokeResponsePayload,
    JUnitReport,
} from '@tophat/sanity-runner-types'

import paths from './paths'

import type { Config } from '@jest/types'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid')

async function parseJUnitReport(
    reportFilename: string,
    report: string | JUnitReport,
): Promise<JUnitReport> {
    if (typeof report === 'string') {
        if (reportFilename.endsWith('.xml')) {
            return await xml2js.parseStringPromise(report)
        }
        return JSON.parse(report)
    }
    return report
}

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
        const requiresTypeScript = require.resolve('./testHooks/globalSetup').endsWith('.ts')

        return {
            bail: false,
            globalSetup: require.resolve('./testHooks/globalSetup'),
            globalTeardown: require.resolve('./testHooks/globalTeardown'),
            globals: {
                SANITY_VARIABLES: this.variables || {},
                SCREENSHOT_OUTPUT: paths.results(this.id),
            },
            notify: false,
            reporters: [
                'default',
                [
                    require.resolve('jest-junit'),
                    {
                        outputDirectory: paths.results(this.id),
                        outputName: paths.junitFileName(this.id),
                    },
                ],
                [
                    require.resolve('./testHooks/screenshotReporter'),
                    {
                        output: paths.results(this.id),
                        urlExpirySeconds: 30 * 24 * 3600,
                        bucket: process.env.SCREENSHOT_BUCKET,
                    },
                ],
            ],
            resetMocks: false,
            resetModules: false,
            roots: [paths.suite(this.id)],
            rootDir: process.cwd(),
            setupFilesAfterEnv: [require.resolve('./testHooks/setupFilesAfterEnv')],
            testEnvironment: require.resolve('./testHooks/testEnvironment'),
            fakeTimers: {
                enableGlobally: false,
            },
            verbose: true,
            watchman: false,
            ...(requiresTypeScript
                ? {
                      transform: {
                          '^.+\\.ts$': '@swc/jest',
                      },
                  }
                : {}),
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

    async format(results: EnhancedAggregatedResult): Promise<InvokeResponsePayload> {
        const reportFilename = paths.junit(this.id)
        const junitContents = await fs.promises.readFile(reportFilename, 'utf-8')
        const report = await parseJUnitReport(reportFilename, junitContents)
        return {
            passed: results.success,
            screenshots: results.screenshots,
            errors: extractRuntimeErrors(results),
            testResults: {
                [path.basename(reportFilename)]: report,
            },
        }
    }
}
