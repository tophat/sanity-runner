const retry = require('async-retry')
const { runCLI } = require('@jest/core')

const Run = require('./run')
const alertOnResult = require('./alertOnResult')

const runJest = async function ({ config }) {
    const jestArgs = {
        json: true,
        runInBand: true,
        config: JSON.stringify(config),
    }
    const { results } = await runCLI(jestArgs, [process.cwd()])
    return { results }
}

const logResults = function (
    results,
    testVariables,
    retryCount,
    runId,
    executionId,
) {
    const suiteResults = results.testResults[0]
    const result = suiteResults.testResults[0]

    const duration = (result.endTime - result.startTime) / 1000

    const splitName = result.name.split('/')
    let status = result.status
    if (results.numPendingTests > 0) {
        status = 'skipped'
    }

    const newResult = {
      variables: testVariables,
      retryCount: retryCount,
      duration: duration,
      status: status,
      endTime: result.endTime,
      startTime: result.startTime,
      testName: splitName[splitName.length - 1],
      runId: runId,
      executionId: executionId,
    }

    console.log(JSON.stringify(newResult))
}

module.exports = class {
    async runTests(testFiles, testVariables, maxRetryCount, executionId) {
        let retryCount = 0
        const run = new Run(testVariables)
        try {
            await run.writeSuites(testFiles)
            const results = await retry(
                async () => {
                    const { results: jestResults } = await runJest({ config: run.jestConfig() })
                    // force retry if test was unsuccesfull
                    // if last retry, return as normal
                    if (!jestResults.success) {
                        if (retryCount !== parseInt(maxRetryCount)) {
                            throw new Error('Test Failed!')
                        }
                    }
                    return jestResults
                },
                {
                    retries: maxRetryCount,
                    onRetry: function () {
                        retryCount++
                    },
                },
            )
            logResults(
                results,
                testVariables,
                retryCount,
                run.id,
                executionId,
            )
            await alertOnResult(testFiles, results, testVariables)
            return await run.format(results)
        } finally {
            await run.cleanup()
        }
    }
}
