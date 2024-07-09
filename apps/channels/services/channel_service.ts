import Channel from '#apps/channels/models/channel'
import {
  CreateChannelSchema,
  UpdateChannelSchema,
  IndexChannelSchema,
  ShowChannelSchema,
  SubscribeChannelSchema,
} from '#apps/channels/validators/channel'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'
import { CachedUser, OccupiedChannel } from '#apps/channels/models/occupied_channels'
import User from '#apps/users/models/user'
import { generateSnowflake } from '#apps/shared/services/snowflake'
import UserService from '#apps/users/services/user_service'
import { inject } from '@adonisjs/core'

export interface PayloadJWTSFUConnection {
  channelSn?: string
  userSn: string
}

@inject()
export default class ChannelService {
  constructor(private userService: UserService) {}

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
    const sn = generateSnowflake()
    const channel = await Channel.create({ ...newChannel, serverId: serverId, serialNumber: sn })
    await channel.related('users').attach([userId])
    return channel
  }

  async update(id: string, payload: UpdateChannelSchema): Promise<Channel> {
    return Channel.updateOrCreate({ id }, payload)
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
          payload = '{"muted": false, "voiceMuted": false, "camera": false}'
        }
        try {
          const mutedState = JSON.parse(payload)
          let user: CachedUser = {
            id: userId,
            username: username,
            muted: mutedState.muted,
            voiceMuted: mutedState.voiceMuted,
            userSn: await this.userService.getSn(userId),
            camera: mutedState.camera,
          }
          users.push(user)
        } catch (e) {
          // TODO: handle error
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
    username: string,
    payload: { muted: boolean; voiceMuted: boolean; camera: boolean }
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
      const channelObject = await Channel.query().where('id', channelId).firstOrFail()
      const channelSn = channelObject?.serialNumber
      const userObject = await User.query().where('id', userId).firstOrFail()
      const userSn = userObject?.serialNumber
      this.changeMutedStatus(userId, serverId, payload)
      const tokenPayload: PayloadJWTSFUConnection = { channelSn, userSn }
      return this.generateToken(tokenPayload)
    } catch (error) {
      // TODO: handle error
      return ''
    }
  }

  async changeMutedStatus(
    userId: string,
    serverId: any,
    payload: { muted: boolean; voiceMuted: boolean; camera: boolean }
  ) {
    redis.hset(`users:${serverId}`, userId, JSON.stringify(payload))
    transmit.broadcast(`users/${serverId}/state`, { message: 'update muted' })
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
      const userObject = await User.query().where('id', userId).firstOrFail()
      const userSn = userObject?.serialNumber
      transmit.broadcast(`servers/${serverId}/movement`, { message: 'user left' })
      const payload: PayloadJWTSFUConnection = { userSn }
      return this.generateToken(payload)
    } catch (error) {
      // TODO: handle error
      return ''
    }
  }

  generateToken(payload: PayloadJWTSFUConnection): string {
    return jwt.sign(payload, env.get('APP_KEY'), { expiresIn: '5m' })
  }
}
