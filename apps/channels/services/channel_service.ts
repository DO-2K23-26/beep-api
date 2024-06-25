import Channel from '#apps/channels/models/channel'
import {
  CreateChannelSchema,
  IndexChannelSchema,
  ShowChannelSchema,
  UpdateChannelSchema,
} from '#apps/channels/validators/channel'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'
import { CachedUser, OccupiedChannel } from '#apps/channels/models/occupied_channels'

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

  async create(
    newChannel: CreateChannelSchema,
    serverId: string,
    userId: string
  ): Promise<Channel> {
    const channel = await Channel.create({ ...newChannel, serverId: serverId })
    await channel.related('users').attach([userId])
    return channel
  }

  async update(payload: UpdateChannelSchema): Promise<Channel> {
    return Channel.updateOrCreate({ id: payload.id }, payload)
  }

  async deleteById(channelId: string): Promise<void> {
    const channel: Channel = await Channel.findOrFail(channelId)
    await channel.delete()
  }

  async occupiedVoiceChannels(serverId: string) {
    //recuperer tous les channels presents dans le server en parametre
    //on parcourt chaque channel et on recupere les users presents dans chaque channel
    const occupiedChannels: OccupiedChannel[] = []
    const channelIds = await redis.keys(`server:${serverId}:channel:*`)

    for (const channel of channelIds) {
      const channelData = await redis.hgetall(channel)
      let occupiedChannel: OccupiedChannel
      let users: CachedUser[] = []
      for (const userId in channelData) {
        let username = channelData[userId]
        users.push({ id: userId, username: username })
      }
      occupiedChannel = { channelId: channel.split(':')[3], users: users }
      occupiedChannels.push(occupiedChannel)
    }
    return occupiedChannels
  }

  async joinVoiceChannel(serverId: string, channelId: string, userId: string, username: string) {
    try {
      const multi = redis.multi()
      const userKey = `user:${userId}`
      const channel = await redis.get(userKey)
      if (channel) {
        multi.del(channel, userId)
      }
      // on ajoute l'utilisateur dans le channel
      multi.hset(`server:${serverId}:channel:${channelId}`, userId, username)
      console.log(await redis.keys(`server:${serverId}:channel:${channelId}`))
      // on associe le channel au user
      multi.set(userKey, `server:${serverId}:channel:${channelId}`)
      await multi.exec()
      transmit.broadcast(`servers/${serverId}/movement`, { message: 'user joined' })
      return true
    } catch (error) {
      console.error('Error joining channel:', error)
      return false
    }
  }

  async quitVoiceChannel(userId: string) {
    // connaissant le channel surlequel se trouve le user on peut le retirer
    try {
      const userKey = `user:${userId}`
      const channel = await redis.get(userKey)
      if (!channel) {
        return false
      }
      const multi = redis.multi()
      multi.hdel(channel, userId)
      multi.del(userKey)
      await multi.exec()
      const serverId = channel.split(':')[1]
      transmit.broadcast(`servers/${serverId}/movement`, { message: 'user left' })
      return true
    } catch (error) {
      console.error('Error joining channel:', error)
      return false
    }
  }
}
