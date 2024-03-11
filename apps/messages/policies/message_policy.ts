import Message from '#apps/messages/models/message'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { JwtPayload } from 'jsonwebtoken'
import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { updateMessageValidator } from '#apps/messages/validators/message'

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
  async edit(): Promise<AuthorizerResponse> {
    console.log(this.ctx)
    const data = await this.ctx.request.validateUsing(updateMessageValidator)
    const message = await Message.findOrFail(data.params.id)
    return message.ownerId === this.payload.sub
  }

  @allowGuest()
  async delete(): Promise<AuthorizerResponse> {
    const message = await Message.findOrFail(this.ctx.params.id)
    return message.ownerId === this.payload.sub
  }
}
