import Member from '#apps/members/models/member'
import UserService from '#apps/users/services/user_service'
import { BasePolicy } from '@adonisjs/bouncer'
import { inject } from '@adonisjs/core'
import { JwtPayload } from 'jsonwebtoken'

@inject()
export default class ServerMemberPolicy extends BasePolicy {
  constructor(protected userService: UserService) {
    super()
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async before(payload: JwtPayload, _action: string, ...params: any[]) {
    const members = params[0] as Member[] | null | undefined

    if (members && members !== undefined) {
      const member = members.find((m) => m.userId === payload.sub)
      if (!member) return false
    } else {
      return false
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async view(_payload: JwtPayload, _members: Member[]) {
    return true
  }
}
