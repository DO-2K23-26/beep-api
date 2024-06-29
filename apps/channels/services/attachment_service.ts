import Attachment from '#apps/storage/models/attachment'
import { GetAttachementSchema } from '../validators/attachment.js'

export default class AttachmentService {
  async findByChannelId(channelId: string, { page = 1, limit = 10 }: GetAttachementSchema) {
    return Attachment.query()
      .whereHas('message', (query) => {
        query.where('channel_id', channelId)
      })
      .paginate(page, limit)
  }
}
