import fs from 'fs'
import path from 'path'

import 'expect-puppeteer'

jest.setTimeout(5 * 60000)

const SCREENSHOT_FILENAME = 'screenshot.png'

import type { Browser, Page } from 'puppeteer-core'

declare let global: typeof globalThis & {
    browser: Browser
    page: Page
    lambdaContext: {
        sanityRequestId: string
    }
    fullStoryUrl?: string
    SANITY_VARIABLES: Partial<Record<string, string>>
    SCREENSHOT_OUTPUT: string
}

beforeEach(async () => {
    global.page = await global.browser.newPage()
    try {
        const testName = expect.getState().currentTestName
        await global.page.setUserAgent('TophatSanityRunner')
        await global.page.setExtraHTTPHeaders({
            'x-sanity-runner-request-id': global.lambdaContext.sanityRequestId,
            'x-sanity-runner-test-name': testName,
        })
    } catch (err) {
        console.error(err)
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

    if (global.SANITY_VARIABLES.FULLSTORY_ENABLED === 'true') {
        try {
            global.fullStoryUrl = await global.page.evaluate('window.FS.getCurrentSessionURL()')
        } catch (err) {
            console.log('No FullStory URL Found')
        }
        await fs.promises.writeFile(
            '/tmp/fullStoryUrl.txt',
            global.fullStoryUrl ?? 'No FullStory URL Found',
            'utf8',
        )
        await new Promise((r) => setTimeout(r, 5000))
    }
    await global.browser.close()
})
