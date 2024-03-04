import Message from '#apps/messages/models/message'
import { CreateMessagesSchema, UpdateMessagesSchema } from '#apps/messages/validators/message'

export default class MessageService {
  async findAll() {
    return Message.query()
  }

  async create(values: CreateMessagesSchema) {
    return await Message.create(values)
  }

  async show(id: string) {
    console.log('id', id)
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
}
