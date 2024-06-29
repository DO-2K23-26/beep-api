import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import User from '#apps/users/models/user'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'
import Server from '#apps/servers/models/server'

@inject()
export default class ServerPolicy extends BasePolicy {
  protected payload: JwtPayload

  constructor(
    protected permissionResolver: PermissionResolver,
    protected ctx: HttpContext
  ) {
    super()
    this.payload = ctx.auth.use('jwt').payload! as JwtPayload
  }

  @allowGuest()

  public async edit(user: User, server: Server): Promise<AuthorizerResponse>{
    return server.ownerId === user.id
  }


}
