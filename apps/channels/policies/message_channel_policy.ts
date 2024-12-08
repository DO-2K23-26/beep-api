import Channel from '#apps/channels/models/channel'
import { ChannelType } from '#apps/channels/models/channel_type'
import ChannelService from '#apps/channels/services/channel_service'
import MessageNotFoundException from '#apps/messages/exceptions/message_not_found_exception'
import Message from '#apps/messages/models/message'
import ServerNotFoundException from '#apps/servers/exceptions/server_not_found_exception'
import Server from '#apps/servers/models/server'
import PermissionResolver from '#apps/shared/services/permissions/permission_resolver'
import { BasePolicy } from '@adonisjs/bouncer'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'
@inject()
export default class ChannelPolicy extends BasePolicy {
  protected payload: JwtPayload

  constructor(
    protected channelService: ChannelService,
    protected permissionResolver: PermissionResolver,
    protected ctx: HttpContext
  ) {
    super()
    this.payload = ctx.auth.use('jwt').payload! as JwtPayload
  }

  async before(payload: JwtPayload, _action: string, ...params: unknown[]) {
    const channelId = params[0] as string | null | undefined
    let channel: Channel
    if (channelId && channelId !== undefined)
      channel = await this.channelService.findByIdOrFail(channelId)
    else return false

    if (channel.type === ChannelType.private_chat) {
      await channel.load('users')
      const channelUser = channel.users.find((user) => user.id === payload.sub)
      if (!channelUser) return false
    } else if (channel.type === ChannelType.text_server && channel.serverId) {
      const serverId = channel.serverId
      const server = await Server.findOrFail(serverId).catch(() => {
        throw new ServerNotFoundException('Server not found', {
          status: 404,
          code: 'E_SERVER_NOT_FOUND',
        })
      })
      await server.load('members')
      const member = server.members.find((m) => m.userId === payload.sub)
      if (!member) return false
    } else {
      return false
    }
  }

  async show() {
    return true
  }

  async index() {
    return true
  }
  async store() {
    return true
  }

  async pin() {
    return true
  }

  async update(payload: JwtPayload, _channelId: string, messageId: string) {
    const message = await Message.find(messageId)
    if (!message)
      throw new MessageNotFoundException('Message not found', {
        status: 404,
        code: 'E_ROW_NOT_FOUND',
      })
    return message.ownerId === payload.sub
  }

  async destroy(payload: JwtPayload, _channelId: string, messageId: string) {
    const message = await Message.find(messageId)
    if (!message)
      throw new MessageNotFoundException('Message not found', {
        status: 404,
        code: 'E_ROW_NOT_FOUND',
      })
    return message.ownerId === payload.sub
  }
}
