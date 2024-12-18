import Server from '#apps/servers/models/server'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'
import { JwtPayload } from 'jsonwebtoken'

@inject()
export default class ServerPolicy extends BasePolicy {
  before() {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async view(_payload: JwtPayload, _server: Server): Promise<AuthorizerResponse> {
    return true
  }
  async edit(payload: JwtPayload, server: Server): Promise<AuthorizerResponse> {
    return server.ownerId === payload.sub
  }
}
