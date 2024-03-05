import Channel from '#apps/channels/models/channel'
import {
  CreateChannelSchema,
  ShowChannelSchema,
  UpdateChannelSchema,
} from '../validators/channel.js'

export default class ChannelService {
  async findAll(): Promise<Channel[]> {
    return Channel.query()
  }

  async findById(data: ShowChannelSchema): Promise<Channel> {
    if (data.messages) {
      return Channel.query()
        .where('id', data.params.id)
        .preload('messages', (query) => {
          query.preload('attachments')
        })
        .firstOrFail()
    }
    return Channel.query().where('id', data.params.id).firstOrFail()
  }

  async create(payload: CreateChannelSchema): Promise<Channel> {
    return Channel.create({
      name: payload.name,
    })
  }

  async update(payload: UpdateChannelSchema): Promise<Channel> {
    return Channel.updateOrCreate({ id: payload.id }, payload)
  }

  async deleteById(channelId: string): Promise<void> {
    const channel: Channel = await Channel.findOrFail(channelId)
    await channel.delete()
  }
}
