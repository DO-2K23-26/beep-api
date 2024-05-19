import { inject } from '@adonisjs/core'
import ChannelService from '#apps/channels/services/channel_service'
import logger from '@adonisjs/core/services/logger'
import { SocketContext } from '#start/ws'
import { StreamPayload, JoinChannelPayload } from '#apps/channels/contracts/payloads'

@inject()
export default class ChannelGateway {
  constructor(private channelService: ChannelService) {
    this.channelService = channelService
  }
  async joinChannel({ server, socket }: SocketContext, message: JoinChannelPayload) {
    const { data, emit } = socket
    if (!data.sub || !data.username) {
      emit('error', {
        code: 400,
        message: 'Bad request',
      })
      return
    }
    logger.info(`Message is ${JSON.stringify(message)}`)
    try {
      await this.channelService.joinVoiceChannel(
        message.server_id,
        message.channel_id,
        data.sub,
        data.username
      )
    } catch (e) {
      emit('error', {
        code: 400,
        message: 'Bad request',
      })
    }
    socket.join(message.channel_id)

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
    const { data, emit } = socket
    if (!data.sub || !data.username) {
      emit('error', {
        code: 400,
        message: 'Bad request',
      })
      return
    }
    try {
      await this.channelService.quitVoiceChannel(data.sub)
    } catch (e) {
      emit('error', {
        code: 400,
        message: 'Bad request',
      })
    }

    socket.leave(message.channel_id)

    server.emit('usermove', {
      message: 'userDisconnected',
    })
  }
}
