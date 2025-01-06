import Channel from '#apps/channels/models/channel'
import { ChannelType } from '#apps/channels/models/channel_type'
import ChannelService from '#apps/channels/services/channel_service'
import MessageService from '#apps/messages/services/message_service'
import ServerService from '#apps/servers/services/server_service'
import { BasePolicy } from '@adonisjs/bouncer'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'
@inject()
export default class MessageChannelPolicy extends BasePolicy {
  protected payload: JwtPayload

  constructor(
    protected channelService: ChannelService,
    protected serverService: ServerService,
    protected messageService: MessageService,
    protected ctx: HttpContext
  ) {
    super()
    this.payload = ctx.auth.use('jwt').payload! as JwtPayload
  }

  async before(payload: JwtPayload, action: string, ...params: unknown[]) {
    const channelId = params[0] as string | null | undefined
    let channel: Channel
    if (channelId && channelId !== undefined)
      channel = await this.channelService.findByIdOrFail(channelId)
    else return false

    if (channel.type === ChannelType.private_chat) {
      // If the user is in the channel and the channel is a private
      // therefore we can bypass show, index and store
      const userIsInChannel = await this.channelService.isUserInChannel(channelId, payload.sub!)
      if ((action === 'destroy' || action === 'update') && !userIsInChannel) return false
      else return userIsInChannel
    } else if (channel.type === ChannelType.text_server && channel.serverId) {
      // If the channel is part of a server, we need to check if the user is part of the server
      // then we will perform other authorization checks
      const serverId = channel.serverId
      const isPresent = await this.serverService.userPartOfServer(payload.sub!, serverId!)
      if (!isPresent) return false
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

  update(payload: JwtPayload, _channelId: string, messageId: string) {
    return this.messageService.isUserAuthor(messageId, payload.sub ?? '')
  }

  destroy(payload: JwtPayload, _channelId: string, messageId: string) {
    return this.messageService.isUserAuthor(messageId, payload.sub ?? '')
  }
}
