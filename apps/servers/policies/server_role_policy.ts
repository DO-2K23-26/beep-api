import { BasePolicy } from '@adonisjs/bouncer'
import { inject } from '@adonisjs/core'
import { JwtPayload } from 'jsonwebtoken'
import ServerService from '#apps/servers/services/server_service'

@inject()
export default class ServerRolePolicy extends BasePolicy {
  constructor(protected serverService: ServerService) {
    super()
  }

  async before(payload: JwtPayload, _action: string, ...params: never[]) {
    const serverId: string | undefined = params[0]

    const isPresent = await this.serverService.userPartOfServer(payload.sub!, serverId!)

    if (!isPresent) {
      return false
    }
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

  async assignation() {
    return true
  }
}
