const fs = require('fs-extra')
const os = require('os')
const path = require('path')

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')

const teardownPuppeteer = async () => {
    await global.__BROWSER__.close()
    await fs.remove(DIR)
}

module.exports = teardownPuppeteer
