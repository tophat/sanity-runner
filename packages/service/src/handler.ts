import type { InvokePayload } from '@tophat/sanity-runner-types'

import { service } from './core'

export const handler = async (event: InvokePayload) => {
    return await service(event)
}
