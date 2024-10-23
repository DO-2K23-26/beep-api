import Message from '#apps/messages/models/message'
import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import User from '#apps/users/models/user'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'
import Server from '#apps/servers/models/server'
import Channel from '#apps/channels/models/channel'

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
  async edit(_user: User | null, message: Message): Promise<AuthorizerResponse> {
    return message.ownerId === this.payload.sub
  }

  @allowGuest()
  async delete(_user: User | null, message: Message, server: Server): Promise<AuthorizerResponse> {
    const isServerAdmin = server.ownerId === this.payload.sub

    return message.ownerId === this.payload.sub || isServerAdmin
  }

  @allowGuest()
  async pin(_user: User | null, messageId: string, channelId: string): Promise<AuthorizerResponse> {
    const message = await Message.findOrFail(messageId)
    const channel = await Channel.findOrFail(channelId)
    const server = await Server.findOrFail(channel.serverId)

    const isServerAdmin: boolean = server.ownerId === this.payload.sub
    return message.ownerId === this.payload.sub || isServerAdmin
  }
}
