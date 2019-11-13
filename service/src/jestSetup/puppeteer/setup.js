const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const chromium = require('chrome-aws-lambda');

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')

module.exports = async () => {
    const config = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless
    }
    if (!process.env.IS_LOCAL) {
        config.args.push('--disable-gpu', '--single-process')
        config.executablePath = process.env.CHROME_PATH
    }
    const browser = await chromium.puppeteer.launch(config)
    global.__BROWSER__ = browser
    await fs.mkdirs(DIR)
    await fs.writeFile(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint())
}
