const fs = require('fs-extra')
const path = require('path')
const { SCREENSHOT_FILENAME } = require('../constants')
const getState = require('expect/build/jestMatchersObject').getState

require('expect-puppeteer') // modifies globals!

jasmine.DEFAULT_TIMEOUT_INTERVAL = 5*60000 //eslint-disable-line

beforeEach(async () => {
    global.page = await global.browser.newPage()
    try {
        const testName = getState().currentTestName
        await global.page.setUserAgent(`TophatSanityRunner`)
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

    const screenshotPath = path.join(
        global.SCREENSHOT_OUTPUT,
        testName,
        SCREENSHOT_FILENAME,
    )

    await fs.ensureDir(path.dirname(screenshotPath))
    await global.page.screenshot({
        fullPage: true,
        path: screenshotPath,
    })

    if (global.SANITY_VARIABLES.hasOwnProperty('FULLSTORY_ENABLED')) {
        if (global.SANITY_VARIABLES.FULLSTORY_ENABLED === 'true') {
            try {
                global.fullStoryUrl = await global.page.evaluate(() => {
                    return window.FS.getCurrentSessionURL()
                })
            } catch (err) {
                global.fullStoryUrl = 'No FullStory URL Found'
            }
            fs.writeFile('/tmp/fullStoryUrl.txt', global.fullStoryUrl)
            await new Promise((r) => setTimeout(r, 5000));
        }
    }
    await global.browser.close()
})
