import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'
import Server from '#apps/servers/models/server'
import ServerService from '../services/server_service.js'
import Member from '#apps/members/models/member'

@inject()
export default class ServerPolicy extends BasePolicy {
  constructor(
    protected permissionResolver: PermissionResolver,
    protected serverService: ServerService,
    protected ctx: HttpContext
  ) {
    super()
  }

  async view(payload: JwtPayload, serverId: string): Promise<AuthorizerResponse> {
    const serverUsers: Member[] = await this.serverService.findUsersByServerId(serverId)

    return !!serverUsers.find((user) => user.userId === payload.sub)
  }

  async edit(payload: JwtPayload, server: Server): Promise<AuthorizerResponse> {
    return server.ownerId === payload.sub
  }
}
