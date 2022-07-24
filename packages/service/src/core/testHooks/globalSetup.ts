import chromium from '@sparticuz/chrome-aws-lambda'

import type { SanityRunnerTestGlobals } from '@tophat/sanity-runner-types'

import type { Browser, PuppeteerLaunchOptions } from 'puppeteer-core'

declare let global: typeof globalThis & {
    browser: Browser

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

    global.browser = await chromium.puppeteer.launch(config)
}
