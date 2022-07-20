import type { BeforeBrowserCleanupContext, PluginHooks } from '@tophat/sanity-runner-types'

const PluginName = 'FullStory Plugin'

let state: string | null = null

export async function getFullStoryUrl(): Promise<string | null> {
    return state
}

async function onBeforeBrowserCleanup(context: BeforeBrowserCleanupContext): Promise<void> {
    if (context.testVariables.FULLSTORY_ENABLED !== 'true') return

    try {
        const url = await context.page.evaluate('window.FS.getCurrentSessionURL()')
        if (typeof url === 'string') {
            state = url
            context.logger.debug(`[FullStory] Session URL: ${url}`)
        }
    } catch (err) {
        context.logger.warn('[FullStory] No URL Found')
    }
}

export default function FullStoryPlugin({
    beforeBrowserCleanup,
}: Pick<PluginHooks, 'beforeBrowserCleanup'>): void {
    beforeBrowserCleanup.tapPromise(PluginName, onBeforeBrowserCleanup)
}
