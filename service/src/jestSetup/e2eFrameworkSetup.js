const fs = require('fs-extra')
const path = require('path')
const { SCREENSHOT_FILENAME } = require('../constants')
const getState = require('expect/build/jest_matchers_object').getState

require('expect-puppeteer') // modifies globals!

jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000 //eslint-disable-line

beforeEach(async () => {
    global.page = await global.browser.newPage()
    await global.page.setUserAgent(`TophatSanityRunner/${global.globalContext.version}`)
    await global.page.setExtraHTTPHeaders({ 'x-sanity-runner-request-id': global.globalContext.awsRequestId })
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
    await global.browser.close()
})
