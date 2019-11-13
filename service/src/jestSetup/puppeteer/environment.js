const chromium = require('chrome-aws-lambda');
const NodeEnvironment = require('jest-environment-node')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')


const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')
const wsEndpointDir = path.join(DIR, 'wsEndpoint')

class PuppeteerEnvironment extends NodeEnvironment {
    async setup() {
        await super.setup()
        const wsEndpoint = await fs.readFile(wsEndpointDir, 'utf8')
        if (!wsEndpoint) throw new Error('wsEndpoint not found')
        this.global.browser = await chromium.puppeteer.connect({
            browserWSEndpoint: wsEndpoint,
        })
    }

    async teardown() {
        this.global.browser.disconnect()
    }
}
module.exports = PuppeteerEnvironment
