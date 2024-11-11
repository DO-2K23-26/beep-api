import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import User from '#apps/users/models/user'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'
import Server from '#apps/servers/models/server'
import ServerService from '../services/server_service.js'
import Member from '#apps/members/models/member'

@inject()
export default class ServerPolicy extends BasePolicy {
  protected payload: JwtPayload

  constructor(
    protected permissionResolver: PermissionResolver,
    protected serverService: ServerService,
    protected ctx: HttpContext
  ) {
    super()
    this.payload = ctx.auth.use('jwt').payload! as JwtPayload
  }

  @allowGuest()
  async show(_: User, _serverId: string): Promise<AuthorizerResponse> {
    const serverUsers: Member[] = await this.serverService.findUsersByServerId(_serverId)

    return !!serverUsers.find((user) => user.userId === this.payload.sub)
  }

  @allowGuest()
  async edit(_: User, server: Server): Promise<AuthorizerResponse> {
    return server.ownerId === this.payload.sub
  }
}
