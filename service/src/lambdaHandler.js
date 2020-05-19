const execa = require('execa')
const posix = require('posix')
const waitpid2 = require('waitpid2')
const TestRunner = require('./testRunner')

if (process.pid === 1) {
    // install a signal handler to collect child processes we may end up with unknowingly.
    // chrome currently leaks child processes and if we're pid1, we need to
    // collect them or else they remain zombies.
    process.on('SIGCHLD', function() {
        let waitPidResult
        while (
            (waitPidResult = waitpid2.waitpid(-1, 0 | waitpid2.WNOHANG))
                .return > 0
        ) {
            if (waitPidResult.exitCode !== null) {
                console.log(
                    'A child process exited normally by calling exit',
                    waitPidResult,
                )
            } else if (waitPidResult.signalCode !== null) {
                console.log(
                    `child process ${
                        waitPidResult.return
                    } terminated because it was sent signal ${
                        waitPidResult.signalCode
                    }`,
                )
            } else {
                console.log("not sure what's going on", waitPidResult)
            }
        }
    })

    // we're also not interested in any core dumps chrome may leave behind, as they
    // eventually lead to a filled tmp volume
    posix.setrlimit('core', { soft: 0, hard: 0 })
}

module.exports.handler = async function(event, context, callback) {
    global.globalContext = context
    global.globalContext.testNames = event.testFiles
    console.log((await execa('find', ['/tmp'])).stdout)
    const runner = new TestRunner()
    const testResults = await runner.runTests(
        event.testFiles,
        event.testVariables,
        event.retryCount,
        context,
    )
    callback(null, testResults)
}
