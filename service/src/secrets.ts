import SecretsManager from 'aws-sdk/clients/secretsmanager'

export async function getSecretValue(secretKey: string) {
    const secretsmanager = new SecretsManager()

    const params = {
        SecretId: secretKey,
    }

    console.log(`[getSecretValue] secret key: ${secretKey}`)

    const result = await secretsmanager.getSecretValue(params).promise()
    return result.SecretString ? JSON.parse(result.SecretString) : null
}
