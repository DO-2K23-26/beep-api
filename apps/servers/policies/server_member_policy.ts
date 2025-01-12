import MemberService from '#apps/members/services/member_service'
import { Permissions } from '#apps/shared/enums/permissions'
import UserService from '#apps/users/services/user_service'
import { BasePolicy } from '@adonisjs/bouncer'
import { inject } from '@adonisjs/core'
import { JwtPayload } from 'jsonwebtoken'
import ServerService from '#apps/servers/services/server_service'
import PermissionsService from '#apps/shared/services/permissions/permissions_service'

@inject()
export default class ServerMemberPolicy extends BasePolicy {
  constructor(
    protected userService: UserService,
    protected memberService: MemberService,
    protected serverService: ServerService,
    protected permissionsService: PermissionsService
  ) {
    super()
  }
  async before(payload: JwtPayload, _action: string, ...params: never[]) {
    const serverId: string | undefined = params[0]

    const isPresent = await this.serverService.userPartOfServer(payload.sub!, serverId!)
    if (!isPresent) return false

    const permissions = await this.memberService.getPermissions(payload.sub!, serverId!)
    const isAdministrator = this.permissionsService.has_permission(
      permissions,
      Permissions.ADMINISTRATOR
    )
    if (isAdministrator) return true
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async view(_payload: JwtPayload) {
    return true
  }

  async update(payload: JwtPayload, serverId: string, memberId: string) {
    const permissions = await this.memberService.getPermissions(payload.sub!, serverId!)
    const canManageNicknames = this.permissionsService.has_permission(
      permissions,
      Permissions.MANAGE_NICKNAMES
    )
    if (canManageNicknames) return true

    const canChangeNickname = this.permissionsService.has_permission(
      permissions,
      Permissions.CHANGE_NICKNAME
    )
    const members = await this.memberService.findFrom([memberId])
    if (canChangeNickname && payload.sub === members[0].userId) return true

    return false
  }
}
