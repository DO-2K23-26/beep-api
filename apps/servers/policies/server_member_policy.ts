import UserService from '#apps/users/services/user_service'
import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'
import { inject } from '@adonisjs/core'
import { JwtPayload } from 'jsonwebtoken'

@inject()
export default class ServerMemberPolicy extends BasePolicy {
  constructor(protected userService: UserService) {
    super()
  }

  async view(payload: JwtPayload, serverId: string) {
    const user = await this.userService.findById(payload.sub!)

    const ids = user.members.map((m) => m.serverId)

    if (ids.includes(serverId)) {
      return AuthorizationResponse.allow()
    }

    return AuthorizationResponse.deny()
  }
}
