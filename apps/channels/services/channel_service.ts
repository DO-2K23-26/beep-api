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
import logger from '@adonisjs/core/services/logger'
import ChannelNotFoundException from '#apps/channels/exceptions/channel_not_found_exception'
import Server from '#apps/servers/models/server'
import ServerNotFoundException from '#apps/servers/exceptions/server_not_found_exception'

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
    const server = await Server.findOrFail(serverId).catch(() => {
      throw new ServerNotFoundException('Server not found', { status: 404, code: 'E_ROWNOTFOUND' })
    })
    await server.load('channels')
    return server.channels
  }

  async create(
    newChannel: CreateChannelSchema,
    serverId: string,
    userId: string
  ): Promise<Channel> {
    const sn = generateSnowflake()
    const type = newChannel.type as 0 | 1 | 2
    const channel = await Channel.create({
      name: newChannel.name,
      type: type,
      serverId: serverId,
      serialNumber: sn,
    })
    await channel.related('users').attach([userId])
    return channel
  }

  async update(id: string, payload: UpdateChannelSchema): Promise<Channel> {
    const channel = await Channel.findOrFail(id).catch(() => {
      throw new ChannelNotFoundException('Channel not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })
    channel.merge(payload)

    return channel.save()
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
      const users: CachedUser[] = []
      for (const userId in channelData) {
        const username = channelData[userId]
        let payload = await redis.hget(`users:${serverId}`, userId)
        if (!payload) {
          payload = '{"muted": false, "voiceMuted": false, "camera": false}'
        }
        try {
          const mutedState = JSON.parse(payload)
          const user: CachedUser = {
            id: userId,
            username: username,
            muted: mutedState.muted,
            voiceMuted: mutedState.voiceMuted,
            userSn: await this.userService.getSn(userId),
            camera: mutedState.camera,
          }
          users.push(user)
        } catch (e) {
          logger.error(e)
        }
      }
      const occupiedChannel = { channelId: channel.split(':')[3], users: users }
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
    } catch {
      return ''
    }
  }

  async changeMutedStatus(
    userId: string,
    serverId: string,
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
    } catch {
      return ''
    }
  }

  generateToken(payload: PayloadJWTSFUConnection): string {
    return jwt.sign(payload, env.get('APP_KEY'), { expiresIn: '5m' })
  }
}
