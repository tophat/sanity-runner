import fs from 'fs'
import os from 'os'
import path from 'path'

import chromium from '@sparticuz/chrome-aws-lambda'

import type { Browser, PuppeteerLaunchOptions } from 'puppeteer-core'

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')

declare let global: typeof globalThis & {
    __BROWSER__: Browser
}

export = async () => {
    const config: PuppeteerLaunchOptions = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
    }
    if (!config.headless) {
        // Local dev.
        config.devtools = true
        config.dumpio = true
        config.slowMo = process.env.SANITY_RUNNER_SLOW_MO
            ? parseInt(process.env.SANITY_RUNNER_SLOW_MO, 10)
            : undefined
    }

    const browser = await chromium.puppeteer.launch(config)
    global.__BROWSER__ = browser
    await fs.promises.mkdir(DIR, { recursive: true })
    await fs.promises.writeFile(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint(), 'utf8')
}
