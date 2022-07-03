import type { JUnitReport } from '@tophat/sanity-runner-types'

export function formatFailedTestResult(file: string, error: unknown): JUnitReport {
    return {
        testsuites: {
            $: {
                name: 'jest tests',
                tests: 1,
                failures: 1,
                time: 0,
            },
            testsuite: [
                {
                    $: {
                        name: file,
                        failures: 1,
                        tests: 1,
                        time: 0,
                    },
                    testcase: [
                        {
                            $: {
                                classname: file,
                                name: file,
                                time: 0,
                            },
                            failure: [String(error)],
                        },
                    ],
                },
            ],
        },
    }
}
