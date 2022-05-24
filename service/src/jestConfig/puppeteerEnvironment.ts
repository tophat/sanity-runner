import fs from 'fs'
import os from 'os'
import path from 'path'

import chromium from '@sparticuz/chrome-aws-lambda'
import NodeEnvironment from 'jest-environment-node'

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')
const wsEndpointDir = path.join(DIR, 'wsEndpoint')

type Browser = {
    disconnect(): void
}

class PuppeteerEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup()
        const wsEndpoint = await fs.promises.readFile(wsEndpointDir, 'utf-8')
        if (!wsEndpoint) throw new Error('wsEndpoint not found')
        this.global.browser = await chromium.puppeteer.connect({
            browserWSEndpoint: wsEndpoint,
        })
    }

    async teardown() {
        ;(this.global.browser as Browser).disconnect()
    }
}

export = PuppeteerEnvironment
