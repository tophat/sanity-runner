const os = require('os')
const path = require('path')

module.exports = {
    chrome: function () {
        return path.join(os.tmpdir(), 'headless-chromium')
    },
    junit: function (runId) {
        return path.join(this.results(runId), this.junitFileName(runId))
    },
    junitFileName: function (runId) {
        return `${runId}.junit.xml`
    },
    run: function (runId) {
        return path.join(os.tmpdir(), 'runs', runId)
    },
    suite: function (runId) {
        return path.join(this.run(runId), 'suites')
    },
    results: function (runId) {
        return path.join(this.run(runId), 'results')
    },
}
