require('ts-node').register({
    transpileOnly: true,
})

const { service } = require('./core')

module.exports = {
    handler: (event) => service(event),
}
