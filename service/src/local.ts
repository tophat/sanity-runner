import chalk from 'chalk'
import express from 'express'
import morgan from 'morgan'

import type { InvokePayload, InvokeResponsePayload } from '@tophat/sanity-runner-types'

import { service } from './core'

const app = express()
app.use(express.json())
app.use(morgan('dev'))

app.post<unknown, InvokeResponsePayload, InvokePayload>(
    '/2015-03-31/functions/function/invocations',
    async (request, response) => {
        const results = await service(request.body)
        return response.json(results).status(200).end()
    },
)

const port = 9000

app.listen(port, () => {
    console.log(
        chalk.green(
            `Sanity Runner Service is listening at ${chalk.bold(`http://localhost:${port}`)}\n`,
        ),
    )
})
