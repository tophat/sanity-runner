const AWS = require('aws-sdk')
const fs = require('fs-extra')
const path = require('path')
const tar = require('tar')

class ChromeInstaller {
    constructor({ s3Bucket, s3Key, executablePath, debug }) {
        this.executablePath = executablePath
        this.s3 = new AWS.S3({ apiVersion: '2006-03-01' })
        this.s3Bucket = s3Bucket
        this.s3Key = s3Key
        this.debug = debug
    }

    async setupChrome() {
        if (!(await this.chromeExecExists())) {
            console.log('Chrome not yet installed')
            try {
                console.log('Downloading executable from s3')
                console.log('Download Status:', await this.setupFromS3())
                await this.chromeExecExists(true)
                if (this.debug) await this.listDirectory()
            } catch (e) {
                console.log('An error occurred when downloading Chrome from S3')
                throw e
            }
        } else {
            console.log('Chrome already installed')
        }
    }

    async chromeExecExists(shouldThrow) {
        try {
            await fs.access(this.executablePath, fs.constants.F_OK)
        } catch (e) {
            if (shouldThrow) throw e
            return false
        }
        return true
    }

    async setupFromS3() {
        return new Promise((resolve, reject) => {
            const params = {
                Bucket: this.s3Bucket,
                Key: this.s3Key,
            }
            console.log('Started download at', new Date().toString())
            this.s3
                .getObject(params)
                .createReadStream()
                .on('error', err => reject(err))
                .pipe(
                    tar.x({
                        C: path.dirname(this.executablePath),
                        strict: true,
                    }),
                )
                .on('error', err => reject(err))
                .on('finish', () => {
                    console.log('Finished at ', new Date().toString())
                })
                .on('end', () => {
                    console.log('Done at ', new Date().toString())
                    resolve('done')
                })
        })
    }

    async listDirectory() {
        const setupChromePath = path.dirname(this.executablePath)
        console.log(`Listing dir: ${setupChromePath}\n--------`)
        const items = await fs.readdir(setupChromePath)
        items.forEach(item => {
            console.log(item)
        })
        console.log('----------')
    }
}

module.exports = ChromeInstaller
