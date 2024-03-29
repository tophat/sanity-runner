import fs from 'fs'
import https from 'https'
import path from 'path'

export async function downloadFile(destination: string, url: string): Promise<void> {
    await fs.promises.mkdir(path.dirname(destination), { recursive: true })
    const stream = fs.createWriteStream(destination, {
        autoClose: true,
    })

    await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => void resolve())
        stream.on('error', (err) => void reject(err))
        https.get(url, { timeout: 10000 }, (res) => {
            res.on('error', (err) => void reject(err))
            res.pipe(stream)
        })
    })
}
