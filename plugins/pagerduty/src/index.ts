import type { PluginHooks } from '@tophat/sanity-runner-types'

import './node-pagerduty.d'
import { PluginInternals } from './plugin'

const PluginName = 'PagerDuty Plugin'

export default function SlackPlugin({
    onTestFailure,
    onTestSuccess,
}: Pick<PluginHooks, 'onTestFailure' | 'onTestSuccess'>): void {
    onTestFailure.tapPromise(PluginName, PluginInternals)
    onTestSuccess.tapPromise(PluginName, PluginInternals)
}
