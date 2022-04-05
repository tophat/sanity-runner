/**
 * @deprecated In favour of https://github.com/PagerDuty/pdjs
 */
declare module 'node-pagerduty' {
    interface Events {
        sendEvent(args: {
            routing_key: string
            dedup_key: string
            event_action: 'resolve' | 'trigger'
            images?: Array<{ src: string }>
            payload?: {
                summary: string
                source: string
                severity: string
                custom_details?: Record<string, any>
            }
        }): Promise<void>
    }

    interface PagerDutyClientConstructor {
        /**
         * @deprecated Use the official PagerDuty client instead: https://github.com/PagerDuty/pdjs.
         */
        new (): PagerDutyClient
    }

    class PagerDutyClient {
        events: Events
    }

    const constructor: PagerDutyClientConstructor
    export default constructor
}
