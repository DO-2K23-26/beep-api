import Channel from '#apps/channels/models/channel'
import {
  CreateChannelSchema,
  UpdateChannelSchema,
  IndexChannelSchema,
  ShowChannelSchema,
} from '#apps/channels/validators/channel'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'
import { CachedUser, OccupiedChannel } from '#apps/channels/models/occupied_channels'

export interface PayloadJWTSFUConnection {
  channelId?: string
  userId: string
}
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

  async update(payload: UpdateChannelSchema): Promise<Channel> {
    return Channel.updateOrCreate({ id: payload.id }, payload)
  }

  async deleteById(channelId: string): Promise<void> {
    const channel: Channel = await Channel.findOrFail(channelId)
    await channel.delete()
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
        let payload = await redis.hget(`users:${serverId}`, userId)
        if (!payload) {
          payload = '{"muted": false, "voiceMuted": false}'
        }
        try {
          const mutedState = JSON.parse(payload)
          let user: CachedUser = {
            id: userId,
            username: username,
            muted: mutedState.muted,
            voiceMuted: mutedState.voiceMuted,
          }
          users.push(user)
        } catch (e) {
          console.error('Error parsing payload:', e)
        }
      }
      occupiedChannel = { channelId: channel.split(':')[3], users: users }
      occupiedChannels.push(occupiedChannel)
    }
    return occupiedChannels
  }

  async joinVoiceChannel(
    serverId: string,
    channelId: string,
    userId: string,
    username: string
  ): Promise<string> {
    try {
      const multi = redis.multi()
      const userKey = `user:${userId}`
      const channel = await redis.get(userKey)
      if (channel) {
        multi.hdel(channel, userId)
      }

      // on ajoute l'utilisateur dans le channel
      multi.hset(`server:${serverId}:channel:${channelId}`, userId, username)
      // on associe le channel au user
      multi.set(userKey, `server:${serverId}:channel:${channelId}`)
      await multi.exec()
      transmit.broadcast(`servers/${serverId}/movement`, { message: 'user joined' })
      const payload: PayloadJWTSFUConnection = { channelId, userId }
      return this.generateToken(payload)
    } catch (error) {
      console.error('Error joining channel:', error)
      return ''
    }
  }

  async quitVoiceChannel(userId: string): Promise<string> {
    // connaissant le channel surlequel se trouve le user on peut le retirer
    try {
      const userKey = `user:${userId}`
      const channel = await redis.get(userKey)
      if (!channel) {
        return ''
      }
      const multi = redis.multi()
      multi.hdel(channel, userId)
      multi.del(userKey)
      await multi.exec()
      const serverId = channel.split(':')[1]
      transmit.broadcast(`servers/${serverId}/movement`, { message: 'user left' })
      const payload: PayloadJWTSFUConnection = { userId }
      return this.generateToken(payload)
    } catch (error) {
      console.error('Error joining channel:', error)
      return ''
    }
  }

  generateToken(payload: PayloadJWTSFUConnection): string {
    return jwt.sign(payload, env.get('APP_KEY'))
  }
}
