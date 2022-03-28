#!/usr/bin/env node
const path = require('path')

const chalk = require('chalk')
const program = require('commander')
const fs = require('fs-extra')
const glob = require('glob')

const EXIT_CODES = require('./exit-codes')
const runTests = require('./run-tests')
const { collectVariables, retrieveConfigurations } = require('./utils')

const CONFIG_OPTIONS = [
    'lambdaFunction',
    'outputDir',
    'testDir',
    'include',
    'var',
    'exclude',
    'retryCount',
    'local',
    'localPort',
    'timeout',
]
const DEFAULT_FUNCTION_NAME = 'sanity-runner-dev-default'
const DEFAULT_LOCAL_PORT = '9000'
const DEFAULT_TEST_DIR = '.'
const DEFAULT_OUTPUT_DIR = './output'
const DEFAULT_RETRY_COUNT = 0
const DEFAULT_TIMEOUT = 720000

program
    .version(require('../package.json').version)
    .name('sanity-runner')
    .arguments('[options] [testPathPattern]')
    .option(
        '--config <path>',
        'The path to a sanity runner ' +
            'configuration file, in the JSON syntax. It specifies how to find ' +
            'and execute tests. It will overridden if the corresponding flag values.',
    )
    .option('--test-dir <directory>', 'Test suites directory')
    .option(
        '--include <regexForTestFiles>',
        'Have the client ONLY run test files matching the supplied regex',
    )
    .option(
        '--exclude <regexForTestFiles>',
        'Have the client ignore NOT run test files matching the supplied regex',
    )
    .option(
        '--lambda-function [functionName]',
        `The AWS Lambda function name. Default to ${DEFAULT_FUNCTION_NAME} if omitted.`,
    )
    .option(
        '--localPort [localPort]',
        `Send tests to container instead of lambda. Used in conjuction with --local Default to ${DEFAULT_LOCAL_PORT} if omitted.`,
    )
    .option(
        '--local',
        'Enables local mode for the sanity-runner-client. Will send tests to local container instead of lambda. Used in conjuction with --containerName',
    )
    .option('--output-dir <directory>', 'Test results output directory.')
    .option('--var [VAR=VALUE]', 'Custom variables passed to all jest tests.', collectVariables, {})
    .option(
        '--retry-count <retryCount>',
        'Specify number of retries a test will perform if an error occurs (default 0)',
    )
    .option(
        '--timeout <timeout>',
        `Specify the timeout (in milliseconds) for waiting on lambda to respond. Default: ${DEFAULT_TIMEOUT}`,
    )
    .parse(process.argv)

const baseConfiguration = {}
if (program.args.length > 0) baseConfiguration.testPathPattern = program.args[0]
const configuration = retrieveConfigurations(program, CONFIG_OPTIONS, baseConfiguration)
const testDir = path.resolve(process.cwd(), configuration.testDir || DEFAULT_TEST_DIR)
const testFileNames = glob.sync('**/*.js', { cwd: testDir })

console.log(`Reading test files in ${testDir}...`)

const includeRegex = configuration.include ? new RegExp(configuration.include) : null
const excludeRegex = configuration.exclude ? new RegExp(configuration.exclude) : null

const testFiles = testFileNames.reduce((payload, filename) => {
    const filePath = path.join(testDir, filename)
    if (
        (includeRegex && !includeRegex.test(filePath)) ||
        (excludeRegex && excludeRegex.test(filePath))
    )
        return payload

    console.log(`- ${filename}`)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    return Object.assign(payload, { [filename]: fileContent })
}, {})

if (Object.keys(testFiles).length === 0) {
    if (includeRegex || excludeRegex) {
        console.log('No test file(s) is found matching the regex supplied in your config settings.')
    } else {
        console.log('No test file(s) is found.')
    }
    process.exit(EXIT_CODES.INVALID_ARGUMENT)
}

if (configuration.local && Object.keys(testFiles).length > 1) {
    console.warn(
        `${chalk.bold.red(
            'ERROR: Local Invoke mode only supports running 1 test. Re-run with test suite with only one test or add --include to regex match only one test.',
        )}`,
    )
    process.exit(EXIT_CODES.TOO_MANY_TESTS)
}
const functionName = configuration.lambdaFunction || DEFAULT_FUNCTION_NAME
const outputDir = path.resolve(configuration.outputDir || DEFAULT_OUTPUT_DIR)
const testVariables = configuration.var
const retryCount = configuration.retryCount || DEFAULT_RETRY_COUNT
const localPort = configuration.localPort || DEFAULT_LOCAL_PORT
const enableLocal = configuration.local || false
const timeout = parseInt(configuration.timeout) || DEFAULT_TIMEOUT

runTests(
    functionName,
    testFiles,
    outputDir,
    testVariables,
    retryCount,
    enableLocal,
    localPort,
    timeout,
)
    .then(function (testsPassed) {
        console.log('All test suites ran.')
        process.exit(testsPassed ? EXIT_CODES : EXIT_CODES.TEST_FAILED)
    })
    .catch(function (err) {
        console.log('Caught rejection')
        console.log(err)
        process.exit(EXIT_CODES.FATAL_ERROR)
    })
