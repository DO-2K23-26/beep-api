import Channel from '#apps/channels/models/channel'
import {
  CreateChannelSchema,
  IndexChannelSchema,
  ShowChannelSchema,
  SubscribeChannelSchema,
  UpdateChannelSchema,
} from '../validators/channel.js'

export default class ChannelService {
  async findAll(data: IndexChannelSchema): Promise<Channel[]> {
    const channels = Channel.query()
    if (data.messages) {
      channels.preload('messages')
    }
    if (data.users) {
      channels.preload('users')
    }
    return channels
  }

  async findAllForUser(userId: string, data: IndexChannelSchema): Promise<Channel[]> {
    const channels = Channel.query().whereHas('users', (builder) => {
      builder.where('user_id', userId)
    })
    if (data.messages) {
      channels.preload('messages')
    }
    if (data.users) {
      channels.preload('users')
    }
    return channels
  }

  async findById(data: ShowChannelSchema): Promise<Channel> {
    const channel = await Channel.findOrFail(data.params.id)
    if (data.messages) {
      await channel.load('messages')
    }
    if (data.users) {
      await channel.load('users')
    }
    return channel
  }

  async create(payload: CreateChannelSchema): Promise<Channel> {
    return await Channel.create({
      name: payload.name,
    })
  }

  async join(userId: string, channelData: SubscribeChannelSchema){
    const channel = await Channel.findOrFail(channelData.params.id)
    await channel.related('users').attach([userId])
    return channel
  }

  async leave(userId: string, channelData: SubscribeChannelSchema){
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
