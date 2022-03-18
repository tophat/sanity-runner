const path = require('path')

const { v4: uuidv4 } = require('uuid')
const fs = require('fs-extra')

const paths = require('./paths')

module.exports = class {
    constructor(variables) {
        this.id = uuidv4()
        this.variables = variables
    }

    async cleanup() {
        await fs.remove(paths.run(this.id))
    }

    jestConfig() {
        return {
            bail: false,
            globalSetup: path.resolve(
                __dirname,
                'jestConfig/puppeteerSetup.js',
            ),
            globalTeardown: path.resolve(
                __dirname,
                'jestConfig/puppeteerTeardown.js',
            ),
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
            setupFilesAfterEnv: [
                path.resolve(__dirname, 'jestConfig/e2eFrameworkSetup.js'),
            ],
            testEnvironment: path.resolve(
                __dirname,
                'jestConfig/puppeteerEnvironment.js',
            ),
            timers: 'real',
            verbose: true,
        }
    }

    async writeSuites(testFiles) {
        const destination = paths.suite(this.id)
        await Promise.all(
            Object.entries(testFiles).map((entry) =>
                fs.outputFile(`${destination}/${entry[0]}`, entry[1]),
            ),
        )
    }

    async format(results) {
        const junitContents = await fs.readFile(paths.junit(this.id), 'utf8')
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

/*
 * Runtime initialization errors are not currently reported by junit reporter
 * https://github.com/jest-community/jest-junit/pull/47
 */
const extractRuntimeErrors = function (results) {
    const errors = []
    if (results.numRuntimeErrorTestSuites > 0) {
      for (const testSuite of results.testResults) {
        for (const tc of testSuite.testResults) {
          if (tc.assertionResults.length === 0 && tc.status === 'failed') {
            errors.push({
                message: tc.message,
                name: tc.name,
            })
          }
        }
      }
    }
    return errors
}
