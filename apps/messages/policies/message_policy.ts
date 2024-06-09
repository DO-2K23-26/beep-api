import Message from '#apps/messages/models/message'
import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import User from '#apps/users/models/user'
import { allowGuest, BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'
import ServerService from '#apps/servers/services/server_service'
import ChannelService from '#apps/channels/services/channel_service'
import { ShowChannelSchema } from '#apps/channels/validators/channel'
import Channel from '#apps/channels/models/channel'

@inject()
export default class MessagePolicy extends BasePolicy {
  protected payload: JwtPayload
  private serverService: ServerService
  private channelService: ChannelService

  constructor(
    protected permissionResolver: PermissionResolver,
    protected ctx: HttpContext
  ) {
    super()
    this.payload = ctx.auth.use('jwt').payload! as JwtPayload
    this.serverService = new ServerService()
    this.channelService = new ChannelService()
  }

  @allowGuest()
  async edit(_user: User | null, message: Message): Promise<AuthorizerResponse> {
    return message.ownerId === this.payload.sub
  }

  @allowGuest()
  async delete(_user: User | null, message: Message): Promise<AuthorizerResponse> {
    let isServerAdmin: boolean
    let showChannelSchema: ShowChannelSchema = {
      params: {
        id: message.channelId,
      },
      users: true,
      messages: undefined,
    }
    const channel: Channel = await this.channelService.findById(showChannelSchema)
    const server = await this.serverService.findById(channel.serverId)
    isServerAdmin = server.ownerId === this.payload.sub

    return message.ownerId === this.payload.sub || isServerAdmin
  }
}
