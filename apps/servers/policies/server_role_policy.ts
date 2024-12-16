import UserService from '#apps/users/services/user_service'
import { BasePolicy } from '@adonisjs/bouncer'
import { inject } from '@adonisjs/core'
import { JwtPayload } from 'jsonwebtoken'
import Server from '#apps/servers/models/server'

@inject()
export default class ServerRolePolicy extends BasePolicy {
  constructor(protected userService: UserService) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async before(payload: JwtPayload, _action: string, ...params: any[]) {
    const server = params[0] as Server | undefined | null

    if (server && server !== undefined) {
      await server.load('members')
      const member = server.members.find((m) => m.userId === payload.sub)
      if (!member) return false
    }
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async view(_payload: JwtPayload, _serverId: string) {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(_payload: JwtPayload, _serverId: string) {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(_payload: JwtPayload, _serverId: string) {
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async destroy(_payload: JwtPayload, _serverId: string) {
    return true
  }
}
