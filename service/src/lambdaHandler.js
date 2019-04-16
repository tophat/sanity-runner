const TestRunner = require('./testRunner')
const ChromeInstaller = require('./chromeInstaller')
const execa = require('execa')
const paths = require('./paths')
const waitpid2 = require('waitpid2')
const posix = require('posix')

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
    console.log((await execa('/usr/bin/find', ['/tmp'])).stdout)
    const chrome = new ChromeInstaller({
        executablePath: paths.chrome(),
        s3Bucket: process.env.CHROME_BUCKET,
        s3Key: 'HeadlessChromium-v1.0.0-55.tar.gz',
        debug: process.env.DEBUG || false,
    })
    await chrome.setupChrome()
    const runner = new TestRunner(chrome.executablePath)
    const testResults = await runner.runTests(
        event.testFiles,
        event.testVariables,
        event.retryCount
    )
    callback(null, testResults)
}
