import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'

export async function getSecretValue<R = any>(secretKey: string): Promise<R | null> {
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
