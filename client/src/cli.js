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
    'testPathPattern',
    'var',
]
const DEFAULT_FUNCTION_NAME = 'sanity-dev-sanityLauncher'
const DEFAULT_TEST_DIR = '.'
const DEFAULT_OUTPUT_DIR = './output'

program
    .version(require('../package.json').version)
    .arguments('[options] [testPathPattern]')
    .option(
        '--config <path>',
        'The path to a sanity runner ' +
            'configuration file, in the JSON syntax. It specifies how to find ' +
            'and execute tests. It will overridden if the corresponding flag values.',
    )
    .option('--test-dir <directory>', 'Test suites directory')
    .option(
        '--test-path-pattern <regexForTestFiles>',
        'Run only tests with paths matching the given regex',
    )
    .option(
        '--lambda-function [functionName]',
        `The AWS Lambda function name. Default to ${DEFAULT_FUNCTION_NAME} if omitted.`,
    )
    .option('--output-dir <directory>', 'Test results output directory.')
    .option(
        '--var [VAR=VALUE]',
        'Custom variables passed to all jest tests.',
        collectVariables,
        {},
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

const testPathsRegex = configuration.testPathPattern
    ? new RegExp(configuration.testPathPattern)
    : null
const testFiles = testFileNames.reduce((payload, filename) => {
    const filePath = path.join(testDir, filename)
    if (testPathsRegex && !testPathsRegex.test(filePath)) return payload

    console.log(`- ${filename}`)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    return Object.assign(payload, { [filename]: fileContent })
}, {})

if (Object.keys(testFiles).length === 0) {
    if (testPathsRegex) {
        console.log(
            `No test file is found matching "${
                configuration.testPathPattern
            }".`,
        )
    } else {
        console.log(`No test file is found.`)
    }
    process.exit(EXIT_CODES.INVALID_ARGUMENT)
}

const functionName = configuration.lambdaFunction || DEFAULT_FUNCTION_NAME
const outputDir = path.resolve(configuration.outputDir || DEFAULT_OUTPUT_DIR)
const testVariables = configuration.var

runTests(functionName, testFiles, outputDir, testVariables)
    .then(function(testsPassed) {
        console.log('All test suites ran.')
        process.exit(testsPassed ? EXIT_CODES : EXIT_CODES.TEST_FAILED)
    })
    .catch(function(err) {
        console.log('Caught rejection')
        console.log(err)
        process.exit(EXIT_CODES.FATAL_ERROR)
    })
