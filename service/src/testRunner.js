const paths = require('./paths')
const execa = require('execa')
const Run = require('./run')

const runJest = async function(chrome_path, ...args) {
    const env = Object.assign({}, process.env, {
        CHROME_PATH: chrome_path,
    })
    const result = await execa(paths.jest(), ['--json', '--runInBand', ...args], {
        cwd: process.cwd(),
        env,
        reject: false
    })
    try {
        result.json = JSON.parse((result.stdout || '').toString())
    } catch (e) {
        throw new Error(
            `
              Cannot parse JSON jest output.
              ERROR: ${e.name} ${e.message}
              STDOUT: ${result.stdout}
              STDERR: ${result.stderr}
            `
        )
    }
    return result
}

module.exports = class {
    constructor(chromePath) {
        this.chromePath = chromePath
    }

    async runTests(testFiles, testVariables) {
        const run = new Run(testVariables)
        try {
            await run.writeSuites(testFiles)
            const results = await runJest(
                this.chromePath,
                '--config',
                JSON.stringify(run.jestConfig()))
            return await run.format(results.json)
        } finally {
            await run.cleanup()
        }
    }
}
