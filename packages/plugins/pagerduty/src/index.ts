import type { PluginHooks } from '@tophat/sanity-runner-types'

import { PluginInternals } from './plugin'

const PluginName = 'PagerDuty Plugin'

export default function PagerDutyPlugin({
    onTestFailure,
    onTestSuccess,
}: Pick<PluginHooks, 'onTestFailure' | 'onTestSuccess'>): void {
    onTestFailure.tapPromise(PluginName, PluginInternals)
    onTestSuccess.tapPromise(PluginName, PluginInternals)
}
