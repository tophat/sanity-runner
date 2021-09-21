const execa = require('execa')
const posix = require('posix')
const TestRunner = require('./testRunner')


if (process.pid === 1) {
    // we're also not interested in any core dumps chrome may leave behind, as they
    // eventually lead to a filled tmp volume
    posix.setrlimit('core', { soft: 0, hard: 0 })
}

module.exports.handler = async function(event, context, callback) {
    console.log((await execa('find', ['/tmp'])).stdout)
    const runner = new TestRunner()
    const testResults = await runner.runTests(
        event.testFiles,
        event.testVariables,
        event.retryCount,
        event.executionId,
    )
    callback(null, testResults)
}
