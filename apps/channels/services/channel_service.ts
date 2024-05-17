import Channel from '#apps/channels/models/channel'
import {
  CreateChannelSchema,
  IndexChannelSchema,
  ShowChannelSchema,
  SubscribeChannelSchema,
  UpdateChannelSchema,
} from '#apps/channels/validators/channel'

export default class ChannelService {
  async findAll(data: IndexChannelSchema): Promise<Channel[]> {
    return Channel.query()
      .if(data.messages, (query) => {
        query.preload('messages')
      })
      .if(data.users, (query) => {
        query.preload('users')
      })
  }

  async findAllForUser(userId: string, data: IndexChannelSchema): Promise<Channel[]> {
    return Channel.query()
      .whereHas('users', (builder) => {
        builder.where('user_id', userId)
      })
      .if(data.messages, (query) => {
        query.preload('messages')
      })
      .if(data.users, (query) => {
        query.preload('users')
      })
  }

  async findById(data: ShowChannelSchema): Promise<Channel> {
    return Channel.query()
      .where('id', data.params.id)
      .if(data.messages, (query) => {
        query.preload('messages', (messageQuery) => {
          messageQuery.preload('owner')
        })
      })
      .if(data.users, (query) => {
        query.preload('users')
      })
      .firstOrFail()
  }

  async findAllByServer(serverId: string): Promise<Channel[]> {
    return Channel.query().where('server_id', serverId)
  }

  async create(newChannel: CreateChannelSchema, serverId: string): Promise<Channel> {
    return await Channel.create({ ...newChannel, serverId })
  }

  async join(userId: string, channelId: string) {
    const channel = await Channel.findOrFail(channelId)
    await channel.related('users').attach([userId])
    
    return channel
  }

  async leave(userId: string, channelData: SubscribeChannelSchema) {
    const channel = await Channel.findOrFail(channelData.params.id)
    await channel.related('users').detach([userId])
    return channel
  }

  async update(payload: UpdateChannelSchema): Promise<Channel> {
    return Channel.updateOrCreate({ id: payload.id }, payload)
  }

  async deleteById(channelId: string): Promise<void> {
    const channel: Channel = await Channel.findOrFail(channelId)
    await channel.delete()
  }
}
