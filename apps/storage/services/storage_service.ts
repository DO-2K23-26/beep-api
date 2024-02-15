import { HttpContext } from '@adonisjs/core/http'
import { S3Driver } from '#apps/shared/drivers/s3_driver'

export default class StorageService {
  S3Driver: S3Driver
  BUCKET_NAME = 'app'
  constructor() {
    this.S3Driver = S3Driver.getInstance()
  }
  async store(request: HttpContext['request']) {
    if (request.file('file')) {
      const file = request.file('file')
      return await this.S3Driver.uploadFile(this.BUCKET_NAME, file!.clientName, file, file!.size)
    } else {
      return 'File not found!'
    }
  }

  async show(params: HttpContext['params']) {
    return await this.S3Driver.getSignedUrl(this.BUCKET_NAME, params.key)
  }

  async destroy(params: HttpContext['params']) {
    return await this.S3Driver.deleteFile(this.BUCKET_NAME, params.key)
  }
}
