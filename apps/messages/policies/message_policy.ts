import Message from '#apps/messages/models/message'
import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import User from '#apps/users/models/user'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'

@inject()
export default class MessagePolicy extends BasePolicy {
  protected payload: JwtPayload

  constructor(
    protected permissionResolver: PermissionResolver,
    protected ctx: HttpContext
  ) {
    super()
    this.payload = ctx.auth.use('jwt').payload! as JwtPayload
  }

  @allowGuest()
  async edit(user: User | null, message: Message): Promise<AuthorizerResponse> {
    return message.ownerId === this.payload.sub
  }

  @allowGuest()
  async delete(user: User | null, message: Message): Promise<AuthorizerResponse> {
    return message.ownerId === this.payload.sub
  }
}
