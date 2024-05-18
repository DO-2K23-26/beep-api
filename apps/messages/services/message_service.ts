import Message from '#apps/messages/models/message'
import { CreateMessagesSchema, UpdateMessagesSchema } from '#apps/messages/validators/message'

export default class MessageService {
  async findAll() {
    return Message.query()
  }

  async create(values: { validated: CreateMessagesSchema; ownerId: string }) {
    return await Message.create({ ...values.validated, ownerId: values.ownerId })
  }

  async show(id: string) {
    return await Message.query().preload('attachments').where('id', id).firstOrFail()
  }

  async update(values: UpdateMessagesSchema) {
    const { params: id, ...rest } = values
    const message = await Message.findOrFail(id.id)
    return await message.merge({ content: rest.content }).save()
  }

  async destroy(id: string) {
    return Message.query().where('id', id).delete()
  }

  async findAllByChannelId(channelId: string) {
    return Message.query().where('channelId', channelId).orderBy('created_at', 'desc')
  }
}
