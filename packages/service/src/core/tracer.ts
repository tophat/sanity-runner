import type { Span, Tracer } from 'dd-trace'

export const tracer: Tracer | null = (() => {
    try {
        return require('dd-trace')
    } catch {
        return null
    }
})()

export const trace =
    tracer?.trace.bind(tracer) ??
    function trace<T>(
        _name: string,
        fn: (span?: Span | undefined, fn?: ((error?: Error | undefined) => any) | undefined) => T,
    ): T {
        return fn()
    }
