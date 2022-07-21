import fs from 'fs'
import os from 'os'
import path from 'path'

import chromium from '@sparticuz/chrome-aws-lambda'

import type { SanityRunnerTestGlobals } from '@tophat/sanity-runner-types'

import type { Browser, PuppeteerLaunchOptions } from 'puppeteer-core'

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')

declare let global: typeof globalThis & {
    __BROWSER__: Browser

    /** Only for internal use. */
    _sanityRunnerTestGlobals?: SanityRunnerTestGlobals
}

export = async () => {
    const config: PuppeteerLaunchOptions = {
        args: chromium.args,
        defaultViewport: {
            deviceScaleFactor: 1,
            hasTouch: false,
            isLandscape: true,
            isMobile: false,
            width: 1920,
            height: 1080,
            ...global._sanityRunnerTestGlobals?.defaultViewport,
        },
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ...(chromium.headless
            ? {}
            : {
                  // Local dev.
                  devtools: true,
                  dumpio: true,
                  slowMo: process.env.SANITY_RUNNER_SLOW_MO
                      ? parseInt(process.env.SANITY_RUNNER_SLOW_MO, 10)
                      : undefined,
              }),
    }

    const browser = await chromium.puppeteer.launch(config)
    global.__BROWSER__ = browser
    await fs.promises.mkdir(DIR, { recursive: true })
    await fs.promises.writeFile(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint(), 'utf8')
}
