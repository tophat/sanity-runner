const os = require('os')
const path = require('path')

const fs = require('fs-extra')
const puppeteer = require('puppeteer')

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')

module.exports = async () => {
    const config = {
        args: [
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox',
        ],
    }
    if (!process.env.IS_LOCAL) {
        config.args.push('--disable-gpu', '--single-process')
        config.executablePath = process.env.CHROME_PATH
    }
    const browser = await puppeteer.launch(config)
    global.__BROWSER__ = browser
    await fs.mkdirs(DIR)
    await fs.writeFile(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint())
}
