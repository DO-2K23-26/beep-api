import { GetObjectCommand, PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

class MyS3Config implements S3ClientConfig {
  region: string
  credentials: { accessKeyId: string; secretAccessKey: string }

  constructor(region: string, accessKeyId: string, secretAccessKey: string) {
    this.region = region
    this.credentials = { accessKeyId, secretAccessKey }
  }
}
export class S3Driver {
  private static instance: S3Driver
  private s3: S3Client

  constructor() {
    this.s3 = new S3Client([
      new MyS3Config(
        process.env.AWS_REGION ?? '',
        process.env.AWS_ACCESS_KEY_ID ?? '',
        process.env.AWS_SECRET_ACCESS_KEY ?? ''
      ),
    ])
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

    const response = await this.s3.send(command)

    return response
  }

  async downloadFile(bucket: string, key: string) {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })

    const response = await this.s3.send(command)
    return response
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


