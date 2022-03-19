const chalk = require('chalk')
const fs = require('fs-extra')
const _ = require('lodash')
const xml2js = require('xml2js')

/**
 * @param {string} variable
 * @param {object} variableMap
 */
const collectVariables = (variable, variableMap) => {
    const equalPos = variable.indexOf('=')
    if (equalPos < 0) {
        return variableMap
    }
    const key = variable.substring(0, equalPos)
    const value = variable.substring(equalPos + 1)
    return Object.assign({}, variableMap, { [key]: value })
}

/**
 * Retrieve test configuration from the Commander program object
 * @param {*} program
 * @param {Array} acceptedConfigs
 * @param {Object?} baseConfiguration
 */
const retrieveConfigurations = (program, acceptedConfigs, baseConfiguration = {}) => {
    const configuration = baseConfiguration
    if (program.config) {
        const jsonConfigs = _.pick(
            JSON.parse(fs.readFileSync(program.config, 'utf8')),
            acceptedConfigs,
        )
        _.merge(configuration, jsonConfigs)
    }
    const flagConfigs = _.pick(program, acceptedConfigs)
    return _.merge(configuration, flagConfigs)
}

/**
 * Convert JUnit XML string into object
 * @param {string} resultXML JUnit result for the
 */
const _parseResultString = async (resultXML) =>
    new Promise((resolve, reject) => {
        xml2js.parseString(resultXML, (err, result) => {
            if (err) {
                reject(err)
                return
            }
            resolve(result)
        })
    })

/**
 * Print all failed test cases in "testcases"
 * @param {Array} testcases
 */
const _printTestFailures = (testcases) => {
    testcases.forEach((testcase) => {
        if (!testcase.failure) return

        console.log(chalk.red(`\n• ${testcase.$.name}`))
        console.log(`${testcase.failure.join('\n')} \n`)
    })
}

/**
 * Pretty-print test result
 * @param {object} result
 */
const _printTestResult = (result) => {
    const { testsuites } = result

    testsuites.testsuite.forEach((suite) => {
        const numFailures = Number(suite.$.failures)
        const numSkipped = Number(suite.$.skipped)
        const numTests = Number(suite.$.tests)
        if (numFailures) {
            console.log(`${chalk.black.bold.bgRed(' FAIL ')} ${suite.$.name} (${suite.$.time}s)`)
            _printTestFailures(suite.testcase)
            return
        }

        if (numSkipped === numTests) {
            console.log(`${chalk.black.bold.bgYellow(' SKIP ')} ${suite.$.name} (${suite.$.time}s)`)
            return
        }

        console.log(`${chalk.black.bold.bgGreen(' PASS ')} ${suite.$.name} (${suite.$.time}s)`)
    })
}

const _formatTotal = (failures, skipped, total) => {
    const result = []
    if (failures) {
        result.push(chalk.bold.red(`${failures} failed`))
    }
    if (skipped) {
        result.push(chalk.bold.yellow(`${skipped} skipped`))
    }
    const passed = total - failures - skipped
    result.push(chalk.bold.green(`${passed} passed`))
    result.push(`${total} total`)
    return result.join(', ')
}

const _printTestSummary = (results) => {
    const counts = {
        numTestSuites: 0,
        numTestSuiteFailures: 0,
        numTestSuiteSkipped: 0,
        numTestCases: 0,
        numTestCaseFailures: 0,
        numTestCaseSkipped: 0,
        testTime: 0,
    }
    results.forEach((result) => {
        counts.testTime += Number(result.$.time) || 0
        result.testsuite.forEach((testSuite) => {
            const numFailed = Number(testSuite.$.failures) || 0
            const numSkipped = Number(testSuite.$.skipped) || 0
            const numTests = Number(testSuite.$.tests) || 0

            counts.numTestSuites += 1
            counts.numTestCases += numTests
            counts.numTestCaseFailures += numFailed
            counts.numTestCaseSkipped += numSkipped
            if (numFailed) {
                counts.numTestSuitesFailures += 1
            } else if (numSkipped === numTests) {
                counts.numTestSuitesSkipped += 1
            }
        })
    })

    const testSuiteResult = _formatTotal(
        counts.numTestSuiteFailures,
        counts.numTestSuiteSkipped,
        counts.numTestSuites,
    )
    const testCasesResult = _formatTotal(
        counts.numTestCaseFailures,
        counts.numTestCaseSkipped,
        counts.numTestCases,
    )
    console.log(`${chalk.bold('Test Suites:')} ${testSuiteResult}`)
    console.log(`${chalk.bold('Tests:')}       ${testCasesResult}`)
    console.log(`${chalk.bold('Time:')}        ${counts.testTime}s\n`)
}

/**
 * @param {object} results key to test result mapping. The test result is in junit xml format.
 */
const formatTestResults = async (results) => {
    console.log('\n')
    const parsedResults = []
    for (const key in results) {
        if (key.endsWith('.xml')) {
            const result = await _parseResultString(results[key])
            _printTestResult(result)
            parsedResults.push(result.testsuites)
        } else {
            parsedResults.push(results[key].testsuites)
            _printTestResult(results[key])
        }
    }
    _printTestSummary(parsedResults)
}

module.exports = {
    collectVariables,
    formatTestResults,
    retrieveConfigurations,
}
