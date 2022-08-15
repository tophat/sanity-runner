import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import 'expect-puppeteer'

import type { SanityRunnerTestGlobals } from '@tophat/sanity-runner-types'

import { logger } from '../../logger'

import type { Browser, CDPSession, Page } from 'puppeteer-core'

const SCREENSHOT_FILENAME = 'screenshot.png'
jest.setTimeout(5 * 60000)

declare let global: typeof globalThis & {
    browser: Browser
    page: Page
    cdpSession?: CDPSession
    testResultDir?: string

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

type ScreencastFrameEvent = {
    data: string
    metadata: {
        offsetTop: number
        pageScaleFactor: number
        deviceWidth: number
        deviceHeight: number
        scrollOffsetX: number
        scrollOffsetY: number
        timestamp: number
    }
    sessionId: number
}

const startScreenCast = async function (page: Page) {
    const cdpSession = await page.target().createCDPSession()
    await cdpSession.send('Page.enable')
    await cdpSession.send('Page.startScreencast', {
        format: 'jpeg',
        maxWidth: 1920,
        maxHeight: 1080,
        everyNthFrame: 1,
        quality: 100,
    })
    const testResultDir = `${os.tmpdir()}/test-video-${Date.now()}`
    fs.mkdirSync(testResultDir, { recursive: true })
    cdpSession.on('Page.screencastFrame', ({ data, sessionId }: ScreencastFrameEvent) => {
        console.log(`Writing screencast frame to ${testResultDir}`)
        const fileName = path.join(`${testResultDir}/screen-${Date.now()}.jpeg`)
        fs.writeFileSync(fileName, data, 'base64')
        cdpSession.send('Page.screencastFrameAck', { sessionId })
    })

    global.cdpSession = cdpSession
    global.testResultDir = testResultDir
}

const stopScreenCast = async function () {
    if (global.cdpSession) {
        await global.cdpSession.send('Page.stopScreencast')
        global.cdpSession = undefined
    }
    if (global.testResultDir) {
        try {
            execSync(
                `ffmpeg -f image2 -framerate 24 -pattern_type glob -i "${global.testResultDir}/*.jpeg" -crf 25 -vcodec libx264 ${global.testResultDir}/video.mp4`,
            )
            console.log(`Output screenshot to ${global.testResultDir}/video.mp4`)
        } catch (e) {
            console.error(e)
        }
    }
}

beforeEach(async () => {
    global.page = await global.browser.newPage()
    await startScreenCast(global.page)
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
        await stopScreenCast()

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
