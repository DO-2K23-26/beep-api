import Channel from '#apps/channels/models/channel'
import { CreateChannelSchema, UpdateChannelSchema } from '../validators/channel.js'
import Message from "#apps/messages/models/message";

export default class ChannelService {
  async findAll(): Promise<Channel[]> {
    return Channel.query()
  }

  async findById(channelId: string): Promise<Channel> {
    return Channel.query().where('id', channelId).firstOrFail()
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

  async findMessages(channelId: string): Promise<Message[]> {
    const channel = await Channel.findOrFail(channelId)
    channel.load('messages')
    return channel.messages
  }
}
