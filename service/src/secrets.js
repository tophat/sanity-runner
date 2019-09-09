const getSecretValue = async function(secretKey){
    var SecretsManager = require('aws-sdk/clients/secretsmanager');
    var secretsmanager = new SecretsManager();

    var params = {
        SecretId: secretKey
    };

    const result = await secretsmanager.getSecretValue(params).promise()
    return JSON.parse(result.SecretString)
}

module.exports = {
    getSecretValue
}
