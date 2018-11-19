const os = require('os')
const path = require('path')

module.exports = {
    chrome: function() {
        return path.join(os.tmpdir(), 'headless_shell')
    },
    jest: function() {
        return path.resolve(__dirname, '../node_modules/jest-cli/bin/jest.js')
    },
    junit: function(run_id) {
        return path.join(this.results(run_id), this.junitFileName(run_id))
    },
    junitFileName: function(run_id) {
        return `${run_id}.junit.xml`
    },
    run: function(run_id) {
        return path.join(os.tmpdir(), 'runs', run_id)
    },
    suite: function(run_id) {
        return path.join(this.run(run_id), 'suites')
    },
    results: function(run_id) {
        return path.join(this.run(run_id), 'results')
    }
}
