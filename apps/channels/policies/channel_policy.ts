import Channel from '#apps/channels/models/channel'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { JwtPayload } from 'jsonwebtoken'
import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class ChannelPolicy extends BasePolicy {
  protected payload: JwtPayload

  constructor(
    protected permissionResolver: PermissionResolver,
    protected ctx: HttpContext
  ) {
    super()
    this.payload = ctx.auth.use('jwt').payload! as JwtPayload
  }

  @allowGuest()
  async show(): Promise<AuthorizerResponse> {
    const channel = await Channel.findOrFail(this.ctx.params.id)
    await channel.load('users')
    const ChannelUser = channel.users.find((user) => user.id === this.payload.sub)
    return !!ChannelUser
  }

  @allowGuest()
  async index(): Promise<AuthorizerResponse> {
    return await this.permissionResolver
      .createResolve(this.payload.resource_access)
      .verifyAccess('admin')
  }
}
