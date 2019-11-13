const paths = require('./paths')
const execa = require('execa')
const Run = require('./run')
const retry = require('async-retry')
const alertOnResult = require('./alertOnResult')

const runJest = async function(chromePath, ...args) {
    const env = Object.assign({}, process.env, {
        CHROME_PATH: chromePath,
    })
    const result = await execa(
        paths.jest(),
        ['--json', '--runInBand', ...args],
        {
            cwd: process.cwd(),
            env,
            reject: false,
        },
    )
    console.log(result)
    try {
        result.json = JSON.parse((result.stdout || '').toString())
    } catch (e) {
        throw new Error(
            `
              Cannot parse JSON jest output.
              ERROR: ${e.name} ${e.message}
              STDOUT: ${result.stdout}
              STDERR: ${result.stderr}
            `,
        )
    }
    return result
}

const logResults = function(results, testVariables, retryCount) {
    const newResult = {}
    const duration =
        (results.testResults[0].endTime - results.testResults[0].startTime) /
        1000
    const splitName = results.testResults[0].name.split('/')
    let status = results.testResults[0].status
    if (results.numPendingTests > 0) {
        status = 'skipped'
    }

    newResult.variables = testVariables
    newResult.retryCount = retryCount
    newResult.duration = duration
    newResult.status = status
    newResult.endTime = results.testResults[0].endTime
    newResult.startTime = results.testResults[0].startTime
    newResult.testName = splitName[splitName.length - 1]

    console.log(JSON.stringify(newResult))
}

module.exports = class {
    constructor(chromePath) {
        console.log(chromePath)
        this.chromePath = chromePath
    }

    async runTests(testFiles, testVariables, maxRetryCount) {
        let retryCount = 0
        const run = new Run(testVariables)
        try {
            await run.writeSuites(testFiles)
            const results = await retry(
                async () => {
                    const res = await runJest(
                        this.chromePath,
                        '--config',
                        JSON.stringify(run.jestConfig()),
                    )
                    // force retry if test was unsuccesfull
                    // if last retry, return as normal
                    if (!res.json.success) {
                        if (retryCount !== parseInt(maxRetryCount)) { // eslint-disable-line
                            throw new Error('Test Failed!')
                        }
                    }
                    return res
                },
                {
                    retries: maxRetryCount,
                    onRetry: function() {
                        retryCount++
                    },
                },
            )
            logResults(results.json, testVariables, retryCount)
            await alertOnResult(testFiles, results.json, testVariables)
            return await run.format(results.json)
        } finally {
            await run.cleanup()
        }
    }
}
