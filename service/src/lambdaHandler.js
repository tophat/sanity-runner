const childProcess = require('child_process')

const TestRunner = require('./testRunner')

module.exports.handler = async function (event, context, callback) {
    childProcess.execSync('find /tmp', { encoding: 'utf-8', stdio: 'inherit' })
    const runner = new TestRunner()
    const testResults = await runner.runTests(
        event.testFiles,
        event.testVariables,
        event.retryCount,
        event.executionId,
    )
    callback(null, testResults)
}
