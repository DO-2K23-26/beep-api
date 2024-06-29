import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import { BasePolicy, allowGuest } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'
import Channel from '#apps/channels/models/channel'

export default class AttachmentChannelPolicy extends BasePolicy {
  protected payload: JwtPayload

  constructor(
    protected permissionResolver: PermissionResolver,
    protected ctx: HttpContext
  ) {
    super()
    this.payload = ctx.auth.use('jwt').payload! as JwtPayload
  }

  @allowGuest()
  async index(channel: Channel, userId: string): Promise<AuthorizerResponse> {
    const channelUser = channel.users.find((user) => user.id === userId)

    return !!channelUser
  }
}
