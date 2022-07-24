import fs from 'fs'
import path from 'path'

import 'expect-puppeteer'

import type { SanityRunnerTestGlobals } from '@tophat/sanity-runner-types'

import { logger } from '../logger'

import type { Browser, Page } from 'puppeteer-core'

const SCREENSHOT_FILENAME = 'screenshot.png'
jest.setTimeout(5 * 60000)

declare let global: typeof globalThis & {
    browser: Browser
    page: Page

    fullStoryUrl?: string
    SANITY_VARIABLES: Partial<Record<string, string>>
    SCREENSHOT_OUTPUT: string

    /** Only for internal use. */
    _sanityRunnerTestGlobals?: SanityRunnerTestGlobals
}

function getCurrentTestName() {
    // Note that this is the "display name" of the test and not the filename.
    // Nothing guarantees this name is unique across all sanity tests.
    return expect.getState().currentTestName
}

beforeEach(async () => {
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
