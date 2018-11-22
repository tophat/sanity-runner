#!/usr/bin/env node
const path = require('path')

const AWS = require('aws-sdk')
const fs = require('fs-extra')
const glob = require('glob')
const program = require('commander')

const EXIT_CODES = require('./exit-codes')
const { collectVariables } = require('./utils')
const runTests = require('./run-tests')

const DEFAULT_FUNCTION_NAME = 'sanity-dev-sanityLauncher'

program
    .version(require('../package.json').version)
    .option('--test-dir <directory>', 'Test suites directory')
    .option(
        '--lambda-function [functionName]',
        `The AWS Lambda function name. Default to ${DEFAULT_FUNCTION_NAME} if omitted.`
    )
    .option('--output-dir <directory>', 'Test results output directory.')
    .option(
        '--var [VAR=VALUE]',
        'Custom variables passed to all jest tests.',
        collectVariables,
        {}
    )

program.parse(process.argv)

if (!program.testDir) {
    console.log('Missing test directory.')
    process.exit(EXIT_CODES.INVALID_ARGUMENT)
}
if (!program.outputDir) {
    console.log('Missing result output directory.')
    process.exit(EXIT_CODES.INVALID_ARGUMENT)
}

const testDir = path.resolve(process.cwd(), program.testDir)
const testFileNames = glob.sync('**/*.js', { cwd: testDir })

console.log(`Reading test files in ${testDir}...`)
const testFiles = testFileNames.reduce((payload, filename) => {
    console.log(`- ${filename}`)
    const filePath = path.join(testDir, filename)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    return Object.assign(payload, { [filename]: fileContent })
}, {})

if (Object.keys(testFiles).length === 0) {
    console.log(`No test file is found in "${testDir}".`)
    process.exit(EXIT_CODES.INVALID_ARGUMENT)
}

const functionName = program.lambdaFunction || DEFAULT_FUNCTION_NAME
const outputDir = path.resolve(program.outputDir || DEFAULT_OUTPUT_DIR)
const testVariables = program.var

runTests(functionName, testFiles, outputDir, testVariables).then(function(testsPassed) {
    console.log('All test suites ran.')
    process.exit(testsPassed ? EXIT_CODES : EXIT_CODES.TEST_FAILED)
}).catch(function(err) {
    console.log('Caught rejection')
    console.log(err)
    process.exit(EXIT_CODES.FATAL_ERROR)
})
