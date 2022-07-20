import type { InvokePayload } from '@tophat/sanity-runner-types'

import { service } from './core'

export const handler = (event: InvokePayload) => service(event)
