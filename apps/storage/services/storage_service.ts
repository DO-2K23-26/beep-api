import { S3Driver } from '#apps/shared/drivers/s3_driver'
import { CreateStorageSchema, UpdateStorageSchema } from '#apps/storage/validators/storage'
import Message from '#apps/messages/models/message'
import { readFileSync } from 'node:fs'
import Attachment from '#apps/storage/models/attachment'
import env from '#start/env'

export default class StorageService {
  S3Driver: S3Driver
  BUCKET_NAME = env.get('S3_BUCKET_NAME') || 'development'

  constructor() {
    this.S3Driver = S3Driver.getInstance()
  }

  async store(values: CreateStorageSchema) {
    const message = await Message.findOrFail(values.messageId)
    const key = message.channelId + '/' + message.id + '/' + values.attachment.clientName
    if (values.attachment.tmpPath) {
      console.log(values.attachment)
      const realFile = readFileSync(values.attachment.tmpPath)
      const buffer = Buffer.from(realFile)
      await this.S3Driver.uploadFile(env.get('S3_BUCKET_NAME'), key, buffer, buffer.length)
      return await message.related('attachments').create({
        name: key,
        contentType: values.attachment.headers['content-type'],
        messageId: message.id,
      })
    }
    throw new Error('File not found')
  }

  async show(values: { key: string }) {
    return 'http://localhost:3333/storage/files/secure/' + values.key
    // return await this.S3Driver.getSignedUrl(env.get('S3_BUCKET_NAME'), values.key)
  }

  async update(values: UpdateStorageSchema) {
    const attachment = await Attachment.findOrFail(values.params.id)
    attachment.load('message')
    const message = await Message.findOrFail(attachment.messageId)
    const key = message.channelId + '/' + message.id + '/' + values.attachment.clientName
    if (values.attachment.tmpPath) {
      const realFile = readFileSync(values.attachment.tmpPath)
      const buffer = Buffer.from(realFile)
      await this.S3Driver.uploadFile(env.get('S3_BUCKET_NAME'), key, buffer, buffer.length)
      const newAttachment = await Attachment.findByOrFail('name', key)
      return newAttachment
        .merge({ name: key, contentType: values.attachment.headers['content-type'] })
        .save()
    }
    throw new Error('File not found')
  }

  async destroy(id: string) {
    const attachment = await Attachment.findOrFail(id)
    await this.S3Driver.deleteFile(env.get('S3_BUCKET_NAME'), attachment.name)
    return attachment.delete()
  }

  async transmit(fileName: string) {
    return await this.S3Driver.getObjects(env.get('S3_BUCKET_NAME'), fileName)
  }
}
