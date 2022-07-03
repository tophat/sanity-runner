import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'

export async function getSecretValue(secretKey: string) {
    const secretsManager = new SecretsManagerClient({})

    const result = await secretsManager.send(
        new GetSecretValueCommand({
            SecretId: secretKey,
        }),
    )

    if (result.SecretString) {
        return JSON.parse(result.SecretString)
    }
    return null
}
