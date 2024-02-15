import Channel from '#apps/channels/models/channel'
import { CreateChannelSchema, UpdateChannelSchema } from '../validators/channel.js'

export default class ChannelService {
    public async findAll(): Promise<Channel[]> {
        return Channel.query()
    }

    public async findById(channelId: string): Promise<Channel> {
        return Channel.query()
            .where("id", channelId)
            .firstOrFail()
    }

    public async create(payload: CreateChannelSchema): Promise<Channel> {
        return Channel.create({
            name: payload.name
        })
    }

    public async update(payload: UpdateChannelSchema): Promise<Channel> {
        return Channel.updateOrCreate({ id: payload.id }, payload)
    }

    public async deleteById(channelId: string): Promise<void> {
        const channel: Channel = await Channel.findOrFail(channelId)
        await channel.delete()
    }
}