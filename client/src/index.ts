#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

import { Cli, Command, Option } from 'clipanion'
import glob from 'glob'
import * as t from 'typanion'

import { version } from '../package.json'

import {
    DEFAULT_FUNCTION_NAME,
    DEFAULT_LOCAL_PORT,
    DEFAULT_OUTPUT_DIR,
    DEFAULT_RETRY_COUNT,
    DEFAULT_TEST_DIR,
    DEFAULT_TIMEOUT,
} from './defaults'
import { configureLogger, logLevelByVerbosity } from './logger'
import { runTests } from './runTests'
import { Configuration, ExecutionContext, LogFormat } from './types'

const EXIT_CODES = {
    SUCCESS: 0,
    FATAL_ERROR: 1,
    INVALID_ARGUMENT: 9,
    TEST_FAILED: 2,
}

class BaseCommand extends Command<ExecutionContext> {
    static usage = Command.Usage({
        description: `sanity-runner-client v${version}`,
    })

    config = Option.String('--config', {
        description:
            'The path to the sanity runner JSON configuration file. This config specifies how to find and execute tests.',
    })
    logFormat = Option.String('--log-format', {
        description: 'How logs should be formatted.',
        validator: t.isEnum(LogFormat),
    })
    verbosity = Option.Counter('-v', { description: 'Log verbosity.' })
    concurrency = Option.String('--concurrency', {
        validator: t.isNumber(),
        description: 'The maximum number of tests to run in parallel.',
    })
    testDir = Option.String('--test-dir', {
        description: 'Test suites directory. Where to find the tests to run.',
    })
    include = Option.String('--include', {
        description: 'Have the client ONLY run test files matching the supplied RegEx.',
    })
    exclude = Option.String('--exclude', {
        description: 'Have the client ignore test files matching the supplied RegEx.',
    })
    lambdaFunction = Option.String('--lambda-function', {
        description: 'The AWS Lambda function name to run.',
    })
    localPort = Option.String('--localPort', {
        description:
            "Send tests to a docker container instead of the Lambda. Used in conjunction with '--local'.",
        validator: t.isNumber(),
    })
    local = Option.Boolean('--local', false, {
        description:
            'Enables local mode for the sanity-runner-client. In local mode, tests will be sent to the local port rather than the lambda function.',
    })
    outputDir = Option.String('--output-dir', {
        description: 'Tests results output directory.',
    })
    retryCount = Option.String('--retry-count', {
        description: 'Specify the number of retries a test will perform upon error.',
        validator: t.isNumber(),
    })
    timeout = Option.String('--timeout', {
        description: 'Specify the timeout (in milliseconds) for waiting on the lambda to respond.',
        validator: t.isNumber(),
    })
    vars = Option.Array('--var', {
        description: 'Custom context exposed in each test case.',
    })
    progress = Option.Boolean('--progress', false, {
        description: 'Show test progress.',
    })

    testPathPatterns = Option.Rest()

    async normalizeConfig(): Promise<Configuration> {
        const baseConfig: Partial<Configuration> = {}
        if (this.config) {
            Object.assign(baseConfig, JSON.parse(await fs.promises.readFile(this.config, 'utf-8')))
        }

        const contextVariables: Partial<Record<string, string>> = Object.fromEntries(
            this.vars?.map((variable) => {
                const [key, ...rest] = variable.split('=')
                return [key, rest.join('=')]
            }) ?? [],
        )

        return {
            logFormat: this.logFormat ?? baseConfig.logFormat ?? LogFormat.Terminal,
            logLevel: process.env.DEBUG?.includes('sanity-runner-client')
                ? 'debug'
                : logLevelByVerbosity(this.verbosity),
            vars: {
                ...baseConfig.vars,
                ...contextVariables,
            },
            testDir: path.resolve(
                process.cwd(),
                this.testDir ?? baseConfig.testDir ?? DEFAULT_TEST_DIR,
            ),
            include: this.include ?? baseConfig.include,
            exclude: this.exclude ?? baseConfig.exclude,
            lambdaFunction:
                this.lambdaFunction ?? baseConfig.lambdaFunction ?? DEFAULT_FUNCTION_NAME,
            localPort: this.localPort ?? baseConfig.localPort ?? DEFAULT_LOCAL_PORT,
            local: (this.local || baseConfig.local) ?? false,
            outputDir: path.resolve(
                process.cwd(),
                this.outputDir ?? baseConfig.outputDir ?? DEFAULT_OUTPUT_DIR,
            ),
            retryCount: this.retryCount ?? baseConfig.retryCount ?? DEFAULT_RETRY_COUNT,
            timeout: this.timeout ?? baseConfig.timeout ?? DEFAULT_TIMEOUT,
            testPathPatterns: this.testPathPatterns ?? [],
            progress: this.progress,
            concurrency: this.concurrency ?? baseConfig.concurrency ?? Infinity,
        }
    }

    async execute() {
        const config = await this.normalizeConfig()
        const logger = configureLogger({ format: config.logFormat, level: config.logLevel })

        if (config.concurrency !== Infinity && config.concurrency < 1) {
            logger.error('Concurrency cannot be less than 1. Omit to use the default.')
            return EXIT_CODES.INVALID_ARGUMENT
        }

        logger.verbose(`Discovering test files in: ${config.testDir} 🔍`)

        let testFilenames = await new Promise<string[]>((resolve, reject) => {
            let pattern = '**/*.js'
            if (config.testPathPatterns.length > 1) {
                pattern = `{${config.testPathPatterns.join(',')}}`
            } else if (config.testPathPatterns.length === 1) {
                pattern = config.testPathPatterns[0]
            }
            glob(pattern, { cwd: config.testDir }, (err, matches) => {
                if (err) return reject(err)
                return resolve(matches.map((name) => path.resolve(config.testDir, name)))
            })
        })

        if (!testFilenames.length) {
            logger.error(`No test files found in '${config.testDir}'.`)
            return EXIT_CODES.INVALID_ARGUMENT
        }

        const include = config.include ? new RegExp(config.include) : null
        const exclude = config.exclude ? new RegExp(config.exclude) : null

        testFilenames = testFilenames
            .filter(
                (filename) =>
                    (!include || include.test(filename)) && (!exclude || !exclude.test(filename)),
            )
            .sort()

        if (!testFilenames.length) {
            logger.error("No test files found after applying 'include' and 'exclude' filters.")
            return EXIT_CODES.INVALID_ARGUMENT
        }

        const { success, duration } = await runTests({ config, testFilenames })

        if (success) {
            logger.info(`✅ All tests passed [${duration.toFixed(3)}s]`)
            return EXIT_CODES.SUCCESS
        }
        logger.info(`❌ At least 1 test failed [${duration.toFixed(3)}s]`)
        return EXIT_CODES.TEST_FAILED
    }
}

const cli = new Cli<ExecutionContext>({
    binaryVersion: version,
    binaryLabel: 'sanity-runner-client',
})
cli.register(BaseCommand)
cli.runExit(process.argv.slice(2))
