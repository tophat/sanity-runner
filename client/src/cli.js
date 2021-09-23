#!/usr/bin/env node
const path = require('path')

const fs = require('fs-extra')
const glob = require('glob')
const program = require('commander')

const EXIT_CODES = require('./exit-codes')
const { collectVariables, retrieveConfigurations } = require('./utils')
const runTests = require('./run-tests')

const CONFIG_OPTIONS = [
    'lambdaFunction',
    'outputDir',
    'testDir',
    'include',
    'var',
    'exclude',
    'retryCount',
    'local',
    'containerName'
]
const DEFAULT_FUNCTION_NAME = 'sanity-runner-dev-default'
const DEFAULT_CONTAINER_NAME = 'ghcr.io/tophat/sanity-runner-client:latest'
const DEFAULT_TEST_DIR = '.'
const DEFAULT_OUTPUT_DIR = './output'
const DEFAULT_RETRY_COUNT = 0

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
        '--container-name [containerName]',
        `Send tests to container instead of lambda. Used in conjuction with --local Default to ${DEFAULT_CONTAINER_NAME} if omitted.`,
    )
    .option(
        '--local',
        'Enables local mode for the sanity-runner-client. Will send tests to local container instead of lambda. Used in conjuction with --containerName' 
    )
    .option('--output-dir <directory>', 'Test results output directory.')
    .option(
        '--var [VAR=VALUE]',
        'Custom variables passed to all jest tests.',
        collectVariables,
        {},
    )
    .option(
        '--retry-count <retryCount>',
        'Specify number of retries a test will perform if an error occurs (default 0)',
    )
    .parse(process.argv)

const baseConfiguration = {}
if (program.args.length > 0) baseConfiguration.testPathPattern = program.args[0]
const configuration = retrieveConfigurations(
    program,
    CONFIG_OPTIONS,
    baseConfiguration,
)
const testDir = path.resolve(
    process.cwd(),
    configuration.testDir || DEFAULT_TEST_DIR,
)
const testFileNames = glob.sync('**/*.js', { cwd: testDir })

console.log(`Reading test files in ${testDir}...`)

const includeRegex = configuration.include
    ? new RegExp(configuration.include)
    : null
const excludeRegex = configuration.exclude
    ? new RegExp(configuration.exclude)
    : null

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
        console.log(
            `No test file(s) is found matching the regex supplied in your config settings.`,
        )
    } else {
        console.log(`No test file(s) is found.`)
    }
    process.exit(EXIT_CODES.INVALID_ARGUMENT)
}

const functionName = configuration.lambdaFunction || DEFAULT_FUNCTION_NAME
const outputDir = path.resolve(configuration.outputDir || DEFAULT_OUTPUT_DIR)
const testVariables = configuration.var
const retryCount = configuration.retryCount || DEFAULT_RETRY_COUNT
const containerName = configuration.containerName || DEFAULT_CONTAINER_NAME
const enableLocal = configuration.local || false
console.log(configuration.local)
console.log(configuration.enableLocal)


runTests(functionName, testFiles, outputDir, testVariables, retryCount, containerName, enableLocal)
    .then(function(testsPassed) {
        console.log('All test suites ran.')
        process.exit(testsPassed ? EXIT_CODES : EXIT_CODES.TEST_FAILED)
    })
    .catch(function(err) {
        console.log('Caught rejection')
        console.log(err)
        process.exit(EXIT_CODES.FATAL_ERROR)
    })
