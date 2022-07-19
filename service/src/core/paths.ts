import os from 'os'
import path from 'path'

export default {
    chrome: function () {
        return path.join(os.tmpdir(), 'headless-chromium')
    },
    junit: function (runId: string) {
        return path.join(this.results(runId), this.junitFileName(runId))
    },
    junitFileName: function (runId: string) {
        return `${runId}.junit.xml`
    },
    run: function (runId: string) {
        return path.join(os.tmpdir(), 'runs', runId)
    },
    suite: function (runId: string) {
        return path.join(this.run(runId), 'suites')
    },
    results: function (runId: string) {
        return path.join(this.run(runId), 'results')
    },
}
