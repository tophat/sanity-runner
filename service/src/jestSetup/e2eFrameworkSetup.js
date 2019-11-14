const path = require('path')

const fs = require('fs-extra')
const getState = require('expect/build/jest_matchers_object').getState

const { SCREENSHOT_FILENAME } = require('../constants')

require('expect-puppeteer') // modifies globals!

jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000 //eslint-disable-line

beforeEach(async () => {
    global.page = await global.browser.newPage()
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
    await global.page.close()
})
