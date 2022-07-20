import type { PluginHooks } from '@tophat/sanity-runner-types'

import { type PluginOptions, createPluginInternals } from './plugin'

const PluginName = 'Slack Plugin'

export default function SlackPlugin(
    { onTestFailure }: Pick<PluginHooks, 'onTestFailure'>,
    options: PluginOptions,
): void {
    onTestFailure.tapPromise(PluginName, createPluginInternals(options))
}
