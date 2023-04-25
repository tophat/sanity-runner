import fs from 'fs'
import path from 'path'
import readline from 'readline'

import 'expect-puppeteer'

import type { SanityRunnerTestGlobals } from '@tophat/sanity-runner-types'

import { logger } from '../../logger'

import type { Browser, Page } from 'puppeteer-core'

const SCREENSHOT_FILENAME = 'screenshot.png'
jest.setTimeout(5 * 60000)

declare let global: typeof globalThis & {
    browser: Browser
    page: Page
    pause?: () => Promise<void>

    fullStoryUrl?: string
    SANITY_VARIABLES: Partial<Record<string, string>>
    SCREENSHOT_OUTPUT: string

    /** Only for internal use. */
    _sanityRunnerTestGlobals?: SanityRunnerTestGlobals
}

async function pause() {
    jest.setTimeout(345600000) // use arbitrarily large timeout
    await global.page?.evaluate(() => {
        // eslint-disable-next-line no-debugger
        debugger
    })
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
    console.log('\n\n A debug statement has been reached. Press <Enter> to resume.')
    await new Promise<void>((resolve) => {
        const handler = () => {
            rl.close()
            resolve()
        }
        rl.on('line', handler)
        rl.on('SIGINT', handler)
    })
}

function getCurrentTestName() {
    // Note that this is the "display name" of the test and not the filename.
    // Nothing guarantees this name is unique across all sanity tests.
    return expect.getState().currentTestName ?? 'Test'
}

beforeEach(async () => {
    global.pause = pause
    global.page = await global.browser.newPage()
    if (global._sanityRunnerTestGlobals?.defaultViewport) {
        global.page.setViewport(global._sanityRunnerTestGlobals.defaultViewport)
    }
    try {
        await global.page.setUserAgent('TophatSanityRunner')
        await global.page.setExtraHTTPHeaders({
            'x-sanity-runner-request-id': global._sanityRunnerTestGlobals?.runId ?? '',
            'x-sanity-runner-test-name': getCurrentTestName(),
        })
    } catch (err) {
        logger.error('Unable to configure global page.', err)
    }
})

afterEach(async () => {
    await global._sanityRunnerTestGlobals?.trace('beforeBrowserCleanup', async () => {
        const screenshotPath = path.join(
            global.SCREENSHOT_OUTPUT,
            getCurrentTestName(),
            SCREENSHOT_FILENAME,
        )
        await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true })
        await global.page.screenshot({
            fullPage: true,
            path: screenshotPath,
        })

        await global._sanityRunnerTestGlobals?.sanityRunnerHooks.beforeBrowserCleanup.promise({
            browser: global.browser,
            page: global.page,
            logger,
            runId: global._sanityRunnerTestGlobals.runId,
            testVariables: global._sanityRunnerTestGlobals.testVariables,
            testMetadata: global._sanityRunnerTestGlobals.testMetadata,
        })
    })
})
