const getSecretValue = async function (secretKey) {
    const SecretsManager = require('aws-sdk/clients/secretsmanager')
    const secretsmanager = new SecretsManager()

    const params = {
        SecretId: secretKey,
    }

    const result = await secretsmanager.getSecretValue(params).promise()
    return JSON.parse(result.SecretString)
}

module.exports = {
    getSecretValue,
}
