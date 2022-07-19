import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')

declare let global: typeof globalThis & {
    __BROWSER__: {
        close(): void
    }
}

const teardownPuppeteer = async () => {
    await global.__BROWSER__.close()
    await fs.promises.rm(DIR, { recursive: true })
}

module.exports = teardownPuppeteer
