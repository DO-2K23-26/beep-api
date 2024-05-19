import { Server, Socket } from 'socket.io'
import logger from '@adonisjs/core/services/logger'
import { createServer } from 'node:http'
import app from '@adonisjs/core/services/app'
import env from '#start/env'

logger.info('Booting websocket server')

export interface SocketContext {
  socket: Socket
  server: Server
}

type WsHandler = (context: SocketContext, ...args: any[]) => void

class WsServer {
  io!: Server
  private booted = false
  private wsListennerMap = new Map<string, WsHandler>()
  private connectionHandler!: ((context: SocketContext) => void) | null

  boot() {
    if (this.booted) {
      return
    }

    const server = createServer()
    this.io = new Server(server, {
      cors: {
        origin: '*',
      },
    })
    app.ready(() => {
      logger.info(`Websocket server is running on port ${env.get('WS_PORT')}`)
      this.booted = true
      if (this.connectionHandler) {
        this.registerOnConnection()
      }
    })

    server.listen(env.get('WS_PORT'))
  }

  on(event: string, listener: WsHandler) {
    if (event === 'connection') {
      this.connectionHandler = listener
      if (this.booted) {
        this.registerOnConnection()
      }
      return
    } else {
      this.wsListennerMap.set(event, listener)
    }
  }

  registerOnConnection() {
    this.io.on('connection', (socket) => {
      if (!this.connectionHandler) {
        throw new Error('Connection handler is not defined')
      }
      this.connectionHandler({
        socket,
        server: this.io,
      })
      this.wsListennerMap.forEach((listener, event) => {
        if (event !== 'connection') {
          socket.on(event, (...args) => {
            listener(
              {
                socket,
                server: this.io,
              },
              ...args
            )
          })
          logger.info(`Listening for ${event}`)
        }
      })
    })
  }
}

const io = new WsServer()

io.boot()

export default io
