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

beforeEach(async () => {
    global.page = await global.browser.newPage()
    try {
        const testName = expect.getState().currentTestName
        await global.page.setUserAgent('TophatSanityRunner')
        await global.page.setExtraHTTPHeaders({
            'x-sanity-runner-request-id': global._sanityRunnerTestGlobals?.runId ?? '',
            'x-sanity-runner-test-name': testName,
        })
    } catch (err) {
        logger.error('Unable to configure global page.', err)
    }
})

afterEach(async () => {
    const testName = expect.getState().currentTestName
    const screenshotPath = path.join(global.SCREENSHOT_OUTPUT, testName, SCREENSHOT_FILENAME)
    await fs.promises.mkdir(path.dirname(screenshotPath), { recursive: true })
    await global.page.screenshot({
        fullPage: true,
        path: screenshotPath,
    })

    if (global._sanityRunnerTestGlobals?.runId) {
        await global._sanityRunnerTestGlobals?.sanityRunnerHooks.beforeBrowserCleanup.promise({
            browser: global.browser,
            page: global.page,
            logger,
            runId: global._sanityRunnerTestGlobals.runId,
            testVariables: global._sanityRunnerTestGlobals.testVariables,
            testMetadata: global._sanityRunnerTestGlobals.testMetadata,
        })
    }

    // not sure why we do this, can it be removed?
    await new Promise((r) => setTimeout(r, 5000))

    await global.browser.close()
})
