import winston from 'winston'

import { type LogFormat, LogLevel } from './types'
import { version } from './version'

export function logLevelByVerbosity(verbosity: number | undefined): keyof typeof LogLevel {
    verbosity = Math.min(Math.max(3, (verbosity ?? 0) + 3), 6)
    const key = Object.entries(LogLevel).find(([, value]) => value === verbosity)?.[0]
    if (key) {
        return key as keyof typeof LogLevel
    }
    return 'info'
}

let logger: winston.Logger | undefined
const state = {
    printingProgress: false,
}

export function configureLogger({
    format,
    level,
}: {
    format: LogFormat
    level: keyof typeof LogLevel
}) {
    const config: winston.LoggerOptions = {
        defaultMeta: {
            sanity_runner_version: version,
        },
        level: String(level),
        transports: [new winston.transports.Console()],
    }

    if (format === 'terminal') {
        config.format = winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(
                ({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`,
            ),
        )
    } else if (format === 'structured') {
        config.format = winston.format.combine(winston.format.timestamp(), winston.format.json())
    }

    logger = winston.createLogger(config)
    logger.exitOnError = false
    return logger
}

export function getLogger() {
    if (!logger) throw new Error('Logger not initialized!')
    return logger
}

export function enableProgress() {
    state.printingProgress = true
    if (logger) logger.silent = true
}

export function disableProgress() {
    state.printingProgress = false
    if (logger) logger.silent = false
}
