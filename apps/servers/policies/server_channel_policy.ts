import { BasePolicy } from '@adonisjs/bouncer'
import { inject } from '@adonisjs/core'
import { JwtPayload } from 'jsonwebtoken'
import ServerService from '#apps/servers/services/server_service'
import MemberService from '#apps/members/services/member_service'
import PermissionsService from '#apps/shared/services/permissions/permissions_service'
import { Permissions } from '#apps/shared/enums/permissions'

@inject()
export default class ServerChannelPolicy extends BasePolicy {
  constructor(
    protected serverService: ServerService,
    protected memberService: MemberService,
    protected permissionsService: PermissionsService
  ) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async before(payload: JwtPayload, _action: string, ...params: any[]) {
    const serverId = params[0] as string | null | undefined

    if (serverId && serverId !== undefined) {
      const isPresent = await this.serverService.userPartOfServer(payload.sub!, serverId)
      if (!isPresent) return false
      const userPermissions = await this.memberService.getPermissions(payload.sub!, serverId)
      const isAdmin = this.permissionsService.has_permission(
        userPermissions,
        Permissions.ADMINISTRATOR
      )
      if (isAdmin) return true
    }
  }

  async view(payload: JwtPayload, serverId: string) {
    const userPermissions = await this.memberService.getPermissions(payload.sub!, serverId)
    return this.permissionsService.validate_permissions(userPermissions, [
      Permissions.VIEW_CHANNELS,
    ])
  }

  async create(payload: JwtPayload, serverId: string) {
    const userPermissions = await this.memberService.getPermissions(payload.sub!, serverId)
    return this.permissionsService.validate_permissions(userPermissions, [
      Permissions.MANAGE_CHANNELS,
    ])
  }

  async update(payload: JwtPayload, serverId: string) {
    const userPermissions = await this.memberService.getPermissions(payload.sub!, serverId)
    return this.permissionsService.validate_permissions(userPermissions, [
      Permissions.MANAGE_CHANNELS,
    ])
  }

  async delete(payload: JwtPayload, serverId: string) {
    const userPermissions = await this.memberService.getPermissions(payload.sub!, serverId)
    return this.permissionsService.validate_permissions(userPermissions, [
      Permissions.MANAGE_CHANNELS,
    ])
  }
}
