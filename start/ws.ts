import { JoinChannelPayload, StreamPayload } from '#apps/channels/contracts/payloads'
import ChannelGateway from '#apps/channels/gateway/channel'
import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import server from '@adonisjs/core/services/server'
import { Server, Socket } from 'socket.io'

logger.info('Booting websocket server')

export interface SocketContext {
  socket: Socket
  server: Server
}

app.ready(async () => {
  const io = new Server(server.getNodeServer())
  logger.info(`Websocket server is running`)
  const channelGateway = await app.container.make(ChannelGateway)
  io.on('connection', (socket: Socket) => {
    console.log('Connection established')

    const context: SocketContext = { socket, server: io }

    socket.on('leave_voice', (payload: JoinChannelPayload) => {
      console.log('leaveVoice event received')
      console.log(payload)
      channelGateway.leaveChannel(context, payload)
    })

    socket.on('audio', (payload: StreamPayload) => {
      console.log('audio event received')
      console.log(payload)
      channelGateway.sendStream(context, payload)
    })

    socket.on('join_voice', (payload: JoinChannelPayload) => {
      console.log('join_voice event received')
      console.log(payload)
      channelGateway.joinChannel(context, payload)
    })
  })
})
