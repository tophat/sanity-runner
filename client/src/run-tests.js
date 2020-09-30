const fs = require('fs-extra')
const https = require('https')
const path = require('path')
const promiseRetry = require('promise-retry')
const uniqueString = require('unique-string')

const AWS = require('aws-sdk')

const { formatTestResults } = require('./utils')

async function testResultPromise(
    functionName,
    executionId,
    testFiles,
    testVariables,
    retryCount,
) {
    const lambda = new AWS.Lambda({
        apiVersion: '2015-03-31',
        httpOptions: {
            timeout: 360000,
        },
    })
    const params = {
        FunctionName: functionName,
        Payload: JSON.stringify({
            testFiles,
            testVariables,
            retryCount,
            executionId,
        }),
    }
    const retryOptions = {
        minTimeout: 3000,
        maxTimeout: 15000,
        randomize: true,
    }
    const response = await promiseRetry(function(retry) {
        return lambda
            .invoke(params)
            .promise()
            .catch(function(err) {
                if (err.statusCode === 429) {
                    retry(err)
                }
                throw err
            })
    }, retryOptions)
    const results = JSON.parse(response.Payload)
    if (results && results.errorMessage) {
        throw new Error(`Fatal lambda error: ${results.errorMessage}`)
    }
    if (!results || !results.testResults) {
        throw new Error(`Inconsistent service response`)
    }
    if (results.errors && results.errors.length > 0) {
        results.errors.forEach(error => {
            console.error(error.message)
        })
        throw new Error('There have been problems executing your test suite')
    }
    return results
}

function reduceTestResults(accumulated, current) {
    return {
        passed: accumulated.passed && current.passed,
        testResults: Object.assign(
            accumulated.testResults,
            current.testResults,
        ),
        screenshots: Object.assign(
            accumulated.screenshots || {},
            current.screenshots || {},
        ),
    }
}

/**
 * Send all sanity tests to the launcher service. Output test results to
 * given directory.
 * @param {string} functionName
 * @param {Object.<string, string>} testFiles
 * @param {string} outputDir
 * @param {Object.<string, string>} testVariables
 */
async function runTests(
    functionName,
    testFiles,
    outputDir,
    testVariables,
    retryCount,
) {
    const executionId = uniqueString()

    const promises = Object.entries(testFiles).map(entry =>
        testResultPromise(
            functionName,
            executionId,
            { [entry[0]]: entry[1] },
            testVariables,
            retryCount,
        ),
    )
    return Promise.all(promises).then(
        async results => {
            const aggregatedResults = results.reduce(reduceTestResults)
            _archiveTestResults(outputDir, aggregatedResults.testResults)
            await _archiveTestScreenshots(
                outputDir,
                aggregatedResults.screenshots,
            )
            await formatTestResults(aggregatedResults.testResults)
            return aggregatedResults.passed
        },
        reason => {
            console.log(reason)
            throw reason
        },
    )
}

function _archiveTestResults(outputDir, testResults) {
    Object.entries(testResults).forEach(([key, value]) => {
        const outputPath = path.join(outputDir, key)
        fs.outputFileSync(outputPath, value, 'utf8')
    })
}

async function _archiveTestScreenshots(outputDir, screenshots) {
    if (!screenshots) {
        return
    }

    const promises = Object.entries(screenshots).map(async ([key, value]) => {
        const outputPath = path.join(outputDir, key)
        await fs.ensureFile(outputPath)
        return new Promise((resolve, reject) => {
            const screenshot = fs.createWriteStream(outputPath)
            screenshot.on('finish', () => resolve())
            screenshot.on('error', err => reject(err))
            https.get(value, res => {
                res.pipe(screenshot)
                res.on('error', err => reject(err))
            })
        })
    })
    await Promise.all(promises)
}

module.exports = runTests
