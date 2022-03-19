const fs = require('fs')
const path = require('path')

const { getState } = require('expect/build/jestMatchersObject')
const { ensureDir } = require('fs-extra')

require('expect-puppeteer') // modifies globals!

jest.setTimeout(5 * 60000)

const SCREENSHOT_FILENAME = 'screenshot.png'

beforeEach(async () => {
    global.page = await global.browser.newPage()
    try {
        const testName = getState().currentTestName
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
    const testName = getState().currentTestName

    const screenshotPath = path.join(global.SCREENSHOT_OUTPUT, testName, SCREENSHOT_FILENAME)

    await ensureDir(path.dirname(screenshotPath))
    await global.page.screenshot({
        fullPage: true,
        path: screenshotPath,
    })

    if (Object.prototype.hasOwnProperty.call(global.SANITY_VARIABLES, 'FULLSTORY_ENABLED')) {
        if (global.SANITY_VARIABLES.FULLSTORY_ENABLED === 'true') {
            try {
                global.fullStoryUrl = await global.page.evaluate(() => {
                    return window.FS.getCurrentSessionURL()
                })
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
    }
    await global.browser.close()
})
