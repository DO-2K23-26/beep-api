import Channel from '#apps/channels/models/channel'
import ChannelService from '#apps/channels/services/channel_service'
import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'
@inject()
export default class MessageChannelPolicy extends BasePolicy {
  protected payload: JwtPayload

  constructor(
    protected channelService: ChannelService,
    protected permissionResolver: PermissionResolver,
    protected ctx: HttpContext
  ) {
    super()
    this.payload = ctx.auth.use('jwt').payload! as JwtPayload
  }

  async show(): Promise<AuthorizerResponse> {
    const channel = await Channel.findOrFail(this.ctx.params.id)
    await channel.load('users')
    const ChannelUser = channel.users.find((user) => user.id === this.payload.sub)
    return !!ChannelUser
  }

  async index(): Promise<AuthorizerResponse> {
    return await this.permissionResolver
      .createResolve(this.payload.resource_access)
      .verifyAccess('admin')
  }
}
