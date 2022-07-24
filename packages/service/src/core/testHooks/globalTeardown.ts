import type { Browser } from 'puppeteer-core'

declare let global: typeof globalThis & {
    browser?: Browser
}

const teardownPuppeteer = async () => {
    if (global.browser) {
        // close any open pages
        const pages = await global.browser.pages()
        await Promise.all(pages.map((page) => page.close()))

        // browser close may hang so we won't wait indefinitely
        await Promise.race([global.browser.close(), new Promise((r) => setTimeout(r, 15000))])
    }
}

module.exports = teardownPuppeteer
