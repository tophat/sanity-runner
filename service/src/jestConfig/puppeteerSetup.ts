import fs from 'fs'
import os from 'os'
import path from 'path'

import chromium from 'chrome-aws-lambda'

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_global_setup')

declare let global: typeof globalThis & {
    __BROWSER__: {
        close(): void
    }
}

export = async () => {
    const config = {
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
    }
    const browser = await chromium.puppeteer.launch(config)
    global.__BROWSER__ = browser
    await fs.promises.mkdir(DIR, { recursive: true })
    await fs.promises.writeFile(path.join(DIR, 'wsEndpoint'), browser.wsEndpoint(), 'utf8')
}
