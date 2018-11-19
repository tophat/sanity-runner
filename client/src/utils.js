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

module.exports = {
    collectVariables
}
