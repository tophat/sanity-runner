import childProcess from 'child_process'

import TestRunner from './testRunner'

interface SanityRunnerEvent {
    testFiles: Record<string, string>
    testVariables: Partial<Record<string, string>>
    retryCount: string | number
    executionId: string
}

export async function handler(
    event: SanityRunnerEvent,
    context: unknown,
    callback: (arg0: unknown, arg1: any) => void,
) {
    if (process.env.DEBUG?.includes('sanity-runner')) {
        childProcess.execSync('find /tmp', { encoding: 'utf-8', stdio: 'inherit' })
    }
    const runner = new TestRunner()
    const testResults = await runner.runTests(
        event.testFiles,
        event.testVariables,
        Number(event.retryCount),
        event.executionId,
    )
    callback(null, testResults)
}
