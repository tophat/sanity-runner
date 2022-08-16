import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import 'expect-puppeteer'

import type { DefaultViewport, SanityRunnerTestGlobals } from '@tophat/sanity-runner-types'

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

const startScreenCast = async function (page: Page, viewPort?: DefaultViewport) {
    const cdpSession = await page.target().createCDPSession()
    await cdpSession.send('Page.enable')
    await cdpSession.send('Page.startScreencast', {
        format: 'jpeg',
        maxWidth: viewPort?.width ?? 1920,
        maxHeight: viewPort?.height ?? 1080,
        everyNthFrame: 1,
        quality: 100,
    })
    const testResultDir = `${os.tmpdir()}/test-video-${Date.now()}`
    fs.mkdirSync(testResultDir, { recursive: true })
    const durationFileName = path.join(testResultDir, 'duration.txt')
    let lastTimestamp: number | null = null
    cdpSession.on('Page.screencastFrame', ({ data, metadata, sessionId }: ScreencastFrameEvent) => {
        console.log(`Writing screencast frame to ${testResultDir}`)
        const now = metadata.timestamp * 1000 // Convert to milliseconds
        const fileName = `screen-${now}.jpeg`
        fs.writeFileSync(path.join(testResultDir, fileName), data, 'base64')
        const duration = lastTimestamp ? now - lastTimestamp : 0
        lastTimestamp = now
        cdpSession.send('Page.screencastFrameAck', { sessionId })

        const durationFileContent =
            duration !== 0
                ? `file ${fileName}\nduration ${duration.toFixed(3)}\n`
                : `file ${fileName}\n`
        fs.appendFileSync(durationFileName, durationFileContent)
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
                `ffmpeg -f concat -i "${global.testResultDir}/duration.txt" -vf "settb=1/1000,setpts=PTS/1000" -vsync vfr -r 1000 -vcodec libx264 -crf 25 ${global.testResultDir}/video.mp4`,
            )
            console.log(`Output screenshot to ${global.testResultDir}/video.mp4`)
        } catch (e) {
            console.error(e)
        }
    }
}

beforeEach(async () => {
    global.page = await global.browser.newPage()
    if (global._sanityRunnerTestGlobals?.defaultViewport) {
        global.page.setViewport(global._sanityRunnerTestGlobals.defaultViewport)
    }
    await startScreenCast(global.page, global._sanityRunnerTestGlobals?.defaultViewport)
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
