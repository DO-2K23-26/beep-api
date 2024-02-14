import { GetObjectCommand, PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Config, S3Config } from '#config/s3_config'

export class MyS3Config implements S3ClientConfig {
  region: string
  credentials: { accessKeyId: string; secretAccessKey: string }

  constructor(config: S3Config) {
    this.region = config.region
    this.credentials = config.credentials
  }
}
export class S3Driver {
  private static instance: S3Driver
  private readonly s3: S3Client

  constructor() {
    this.s3 = new S3Client([new MyS3Config(s3Config)])
  }

  static getInstance(): S3Driver {
    if (!S3Driver.instance) {
      S3Driver.instance = new S3Driver()
    }
    return S3Driver.instance
  }

  async uploadFile(bucket: string, key: string, body: any) {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
    })

    return await this.s3.send(command)
  }

  async downloadFile(bucket: string, key: string) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    return await this.s3.send(command)
  }

  async getSignedUrl(bucket: string, key: string) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    // Expires in 1 hour (3600 seconds)
    return await getSignedUrl(this.s3, command, { expiresIn: 3600 })
  }
}


