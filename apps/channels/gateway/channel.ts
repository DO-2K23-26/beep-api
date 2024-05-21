import { inject } from '@adonisjs/core'
import ChannelService from '#apps/channels/services/channel_service'
import logger from '@adonisjs/core/services/logger'
import { StreamPayload, JoinChannelPayload } from '#apps/channels/contracts/payloads'
import { SocketContext } from '#start/ws'
import jwt from 'jsonwebtoken'
import { Payload } from '#apps/authentication/contracts/payload'

@inject()
export default class ChannelGateway {
  constructor(private channelService: ChannelService) {
    this.channelService = channelService
  }
  async joinChannel({ server, socket }: SocketContext, message: JoinChannelPayload) {
    const { emit } = socket
    const payload = jwt.decode(socket.handshake.auth.token) as Payload
    console.log(payload)
    if (!payload?.sub || !payload?.username) {
      emit('error', {
        code: 400,
        message: 'Bad request',
      })
      return
    }
    logger.info(`Message is ${JSON.stringify(message)}`)
    try {
      await this.channelService.joinVoiceChannel(
        message.serverId,
        message.channelId,
        payload.sub,
        payload.username
      )
    } catch (e) {
      emit('error', {
        code: 400,
        message: 'Bad request',
      })
    }
    socket.join(message.channelId)

    server.emit('usermove', {
      message: 'userConnected',
    })
  }

  sendStream({ server, socket }: SocketContext, message: StreamPayload) {
    server.to(message.channel_id).except(socket.id).emit('stream', {
      audio: message.audio,
    })
  }

  async leaveChannel({ socket, server }: SocketContext, message: JoinChannelPayload) {
    const { emit } = socket
    const payload = jwt.decode(socket.handshake.auth.token) as Payload
    if (!payload.sub || !payload.username) {
      emit('error', {
        code: 400,
        message: 'Bad request',
      })
      return
    }
    console.log('first test')
    try {
      await this.channelService.quitVoiceChannel(payload.sub)
    } catch (e) {
      emit('error', {
        code: 400,
        message: 'Bad request',
      })
    }
    socket.leave(message.channelId)
    server.emit('usermove', {
      message: 'userDisconnected',
    })
  }
}
