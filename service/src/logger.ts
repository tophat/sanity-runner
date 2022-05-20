import winston from 'winston'

import { version } from '../package.json'

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: {
        sanity_runner_version: version,
    },
    transports: [
        new winston.transports.Console({
            format: winston.format.json(),
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        }),
    ],
})

logger.exitOnError = false
