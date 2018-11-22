const fs = require('fs-extra')

const _ = require('lodash')
const yaml = require('js-yaml')

/**
 * @param {string} variable
 * @param {object} variableMap
 */
function collectVariables(variable, variableMap) {
    const equalPos = variable.indexOf('=')
    if (equalPos < 0) {
        return variableMap
    }
    const key = variable.substring(0, equalPos)
    const value = variable.substring(equalPos + 1)
    return Object.assign({}, variableMap, {[key]: value})
}

/**
 * Retrieve test configuration from the Commander program object
 * @param {*} program
 */
const retrieveConfigurations = program => {
    const CONFIG_OPTIONS = ['testDir', 'outputDir', 'lambdaFunction', 'var']

    const configuration = {}
    if (program.config) {
        const ymlConfigs = _.pick(
            yaml.safeLoad(fs.readFileSync(program.config, 'utf8')),
            CONFIG_OPTIONS,
        )
        _.merge(configuration, ymlConfigs)
    }
    const flagConfigs = _.pick(program, CONFIG_OPTIONS)
    return _.merge(configuration, flagConfigs)
}

module.exports = {
    collectVariables,
    retrieveConfigurations,
}
