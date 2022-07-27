import fs from 'fs'
import os from 'os'
import path from 'path'

import { runCLI } from '@jest/core'
import chromium from '@sparticuz/chrome-aws-lambda'
import xml2js from 'xml2js'

import type {
    EnhancedAggregatedResult,
    InvokeResponsePayload,
    JUnitReport,
} from '@tophat/sanity-runner-types'

import paths from '../paths'
import { trace } from '../tracer'

import type { RunTestContext } from '../types'
import type { Config } from '@jest/types'
import type { Browser, PuppeteerLaunchOptions } from 'puppeteer-core'

declare let global: typeof globalThis & {
    browser?: Browser
}

const asInteger = (v: any): number => (v ? parseInt(v, 10) : 0)

function coerceJUnitReport(rawReport: JUnitReport): JUnitReport {
    // xml2js parses numbers as strings. This converts it back.
    const report: JUnitReport = {
        testsuites: {
            $: {
                name: rawReport.testsuites.$.name,
                failures: asInteger(rawReport.testsuites.$.failures),
                tests: asInteger(rawReport.testsuites.$.tests),
                time: Number(rawReport.testsuites.$.time),
            },
            testsuite: rawReport.testsuites.testsuite?.map((suite) => ({
                $: {
                    failures: asInteger(suite.$.failures),
                    skipped: asInteger(suite.$.skipped),
                    tests: asInteger(suite.$.tests),
                    name: suite.$.name,
                    time: Number(suite.$.time),
                },
                testcase: suite.testcase.map((testcase) => ({
                    failure: testcase.failure,
                    $: {
                        classname: testcase.$.classname,
                        name: testcase.$.name,
                        time: Number(testcase.$.time),
                    },
                })),
            })),
        },
    }
    return report
}

async function parseJUnitReport(
    reportFilename: string,
    report: string | JUnitReport,
): Promise<JUnitReport> {
    if (typeof report === 'string') {
        if (reportFilename.endsWith('.xml')) {
            return coerceJUnitReport(await xml2js.parseStringPromise(report))
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

const runJest = async function ({
    config,
}: {
    config: Config.InitialOptions
}): Promise<{ results: EnhancedAggregatedResult }> {
    return trace('jest', async () => {
        const jestArgs: Config.Argv = {
            _: [],
            $0: 'sanity-runner',
            json: true,
            runInBand: true,
            config: JSON.stringify(config),
            watch: false,
            watchAll: false,
        }
        const { results } = await runCLI(jestArgs, [process.cwd()])

        // insert a newline after the Jest stderr output to make logs easier to read
        process.stderr.write('\n')

        // The AggregatedResult is converted to EnhancedAggregatedResult via a custom reporter.
        return { results } as { results: EnhancedAggregatedResult }
    })
}

export default class JestPuppeteerTestRunner {
    private context: RunTestContext
    private tmpDataDir?: string

    static displayName = 'Jest-Puppeteer Test Runner'

    constructor(context: RunTestContext) {
        this.context = context
    }

    get name() {
        return JestPuppeteerTestRunner.displayName
    }

    async run(): Promise<EnhancedAggregatedResult> {
        await this.setupPuppeteer()
        try {
            const { results: jestResults } = await runJest({
                config: this.jestConfig(),
            })
            return jestResults
        } finally {
            try {
                await this.teardownPuppeteer()
            } catch {}
        }
    }

    private async setupPuppeteer(): Promise<void> {
        this.tmpDataDir = await fs.promises.mkdtemp(
            path.join(os.tmpdir(), 'sanity-runner-puppeteer-'),
        )

        const config: PuppeteerLaunchOptions = {
            args: chromium.args,
            defaultViewport: {
                deviceScaleFactor: 1,
                hasTouch: false,
                isLandscape: true,
                isMobile: false,
                ...this.context.defaultViewport,
            },
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            userDataDir: this.tmpDataDir,
            ...(chromium.headless
                ? {}
                : {
                      // Local dev.
                      devtools: true,
                      dumpio: true,
                      slowMo: process.env.SANITY_RUNNER_SLOW_MO
                          ? parseInt(process.env.SANITY_RUNNER_SLOW_MO, 10)
                          : undefined,
                  }),
        }

        global.browser = await chromium.puppeteer.launch(config)
    }

    private async teardownPuppeteer(): Promise<void> {
        try {
            if (global.browser) {
                // close any open pages
                const pages = await global.browser.pages()
                await Promise.all(pages.map((page) => page.close()))

                // browser close may hang so we won't wait indefinitely
                await Promise.race([
                    global.browser.close(),
                    new Promise((r) => setTimeout(r, 15000)),
                ])
            }
        } finally {
            try {
                if (this.tmpDataDir) {
                    await fs.promises.rm(this.tmpDataDir, { recursive: true })
                }
            } catch {}
        }
    }

    private jestConfig(): Config.InitialOptions {
        const requiresTypeScript = require.resolve('./testHooks/setupFilesAfterEnv').endsWith('.ts')

        return {
            bail: false,
            globals: {
                SANITY_VARIABLES: this.context.testVariables || {},
                SCREENSHOT_OUTPUT: paths.results(this.context.runId),
            },
            notify: false,
            reporters: [
                'default',
                [
                    require.resolve('jest-junit'),
                    {
                        outputDirectory: paths.results(this.context.runId),
                        outputName: paths.junitFileName(this.context.runId),
                    },
                ],
                [
                    // Note that the testHooks path must work in both the 'lib' and in the 'bundle'
                    require.resolve('./testHooks/screenshotReporter'),
                    {
                        output: paths.results(this.context.runId),
                        // max expiry is 7 days (AWS limitation)
                        urlExpirySeconds: 7 * 24 * 3600,
                        bucket: process.env.SCREENSHOT_BUCKET,
                    },
                ],
            ],
            resetMocks: false,
            resetModules: false,
            roots: [paths.suite(this.context.runId)],
            rootDir: process.cwd(),
            setupFilesAfterEnv: [require.resolve('./testHooks/setupFilesAfterEnv')],
            testEnvironment: require.resolve('jest-environment-node'),
            fakeTimers: {
                enableGlobally: false,
            },
            verbose: true,
            watchman: false,
            watch: false,
            watchAll: false,
            ...(requiresTypeScript
                ? {
                      transform: {
                          '^.+\\.ts$': '@swc/jest',
                      },
                  }
                : {}),
        }
    }

    async writeTestCodeToDisk({ testCode }: { testCode: string }) {
        await fs.promises.mkdir(paths.results(this.context.runId), { recursive: true })

        const destination = paths.suite(this.context.runId)
        await fs.promises.mkdir(destination, { recursive: true })

        const filepath = path.join(destination, `${this.context.runId}.test.js`)
        await fs.promises.mkdir(path.dirname(filepath), { recursive: true })
        await fs.promises.writeFile(filepath, testCode, 'utf-8')
    }

    async cleanup() {
        await fs.promises.rm(paths.run(this.context.runId), { recursive: true })
    }

    async format(results: EnhancedAggregatedResult): Promise<InvokeResponsePayload> {
        const reportFilename = paths.junit(this.context.runId)
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
