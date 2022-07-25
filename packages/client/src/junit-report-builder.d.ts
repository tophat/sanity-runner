declare module 'junit-report-builder' {
    interface TestCase {
        name(v: string): TestCase
        failure(message: string, type: string): TestCase
        error(message: string, type: string, content: string): TestCase
        skipped(): TestCase
        time(v: number): TestCase
        errorAttachment(path: string): TestCase
        stacktrace(stacktrace: string): TestCase
        file(file: string): TestCase
    }

    interface TestSuite {
        name(v: string): TestSuite
        testCase(): TestCase
    }

    interface Builder {
        testSuite(): TestSuite
        build(): string
        writeTo(filename: string): void
    }

    const builder: Builder

    export default builder
}
