import type {
    BeforeBrowserCleanupContext,
    OnTestCompleteContext,
    PluginHooks,
} from '@tophat/sanity-runner-types'

const PluginName = 'FullStory Plugin'
const PluginOutputKey = 'fullstory'

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

async function onTestComplete(context: OnTestCompleteContext): Promise<void> {
    if (state) {
        context.setPluginOutput(PluginOutputKey, {
            url: state,
        })
    }
}

export default function FullStoryPlugin({
    beforeBrowserCleanup,
    onTestFailure,
    onTestSuccess,
}: Pick<PluginHooks, 'beforeBrowserCleanup' | 'onTestFailure' | 'onTestSuccess'>): void {
    beforeBrowserCleanup.tapPromise(PluginName, onBeforeBrowserCleanup)
    onTestFailure.tapPromise(PluginName, onTestComplete)
    onTestSuccess.tapPromise(PluginName, onTestComplete)
}
