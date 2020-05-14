const uuidv4 = require('uuid/v4')
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
            globalSetup: '<rootDir>/src/jestSetup/puppeteer/setup.js',
            globalTeardown: '<rootDir>/src/jestSetup/puppeteer/teardown.js',
            globals: {
                globalContext: globalContext
                SANITY_VARIABLES: this.variables || {},
                SCREENSHOT_OUTPUT: paths.results(this.id),
            },
            notify: false,
            reporters: [
                'default',
                ['jest-junit', { output: paths.junit(this.id) }],
                [
                    '<rootDir>/src/jestSetup/screenshotReporter',
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
            setupTestFrameworkScriptFile:
                '<rootDir>/src/jestSetup/e2eFrameworkSetup.js',
            testEnvironment: '<rootDir>/src/jestSetup/puppeteer/environment.js',
            timers: 'real',
            verbose: false,
        }
    }

    async writeSuites(testFiles) {
        const destination = paths.suite(this.id)
        await Promise.all(
            Object.entries(testFiles).map(entry =>
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
const extractRuntimeErrors = function(results) {
    const errors = []
    if (results.numRuntimeErrorTestSuites > 0) {
        results.testResults.forEach(tc => {
            if (tc.assertionResults.length === 0 && tc.status === 'failed') {
                errors.push({
                    message: tc.message,
                    name: tc.name,
                })
            }
        })
    }
    return errors
}
