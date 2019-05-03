const paths = require('./paths')
const execa = require('execa')
const Run = require('./run')
const retry = require('async-retry')

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

module.exports = class {
    constructor(chromePath) {
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

            return await run.format(results.json)
        } finally {
            await run.cleanup()
        }
    }
}
