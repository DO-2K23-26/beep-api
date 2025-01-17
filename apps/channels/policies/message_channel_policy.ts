import Channel from '#apps/channels/models/channel'
import { ChannelType } from '#apps/channels/models/channel_type'
import ChannelService from '#apps/channels/services/channel_service'
import MemberService from '#apps/members/services/member_service'
import MessageService from '#apps/messages/services/message_service'
import ServerService from '#apps/servers/services/server_service'
import { Permissions } from '#apps/shared/enums/permissions'
import PermissionsService from '#apps/shared/services/permissions/permissions_service'
import { BasePolicy } from '@adonisjs/bouncer'
import { inject } from '@adonisjs/core'
import { JwtPayload } from 'jsonwebtoken'
@inject()
export default class MessageChannelPolicy extends BasePolicy {
  constructor(
    protected channelService: ChannelService,
    protected serverService: ServerService,
    protected messageService: MessageService,
    protected memberService: MemberService,
    protected permissionsService: PermissionsService
  ) {
    super()
  }

  async before(payload: JwtPayload, action: string, ...params: unknown[]) {
    const channelId = params[0] as string | null | undefined
    let channel: Channel
    if (channelId && channelId !== undefined)
      channel = await this.channelService.findByIdOrFail(channelId)
    else return false

    if (channel.type === ChannelType.PRIVATE_CHAT) {
      // If the user is in the channel and the channel is a private
      // therefore we can bypass show, index and store
      const userIsInChannel = await this.channelService.isUserInChannel(channelId, payload.sub!)
      if ((action === 'destroy' || action === 'update') && !userIsInChannel) return false
      else return userIsInChannel
    } else if (channel.type === ChannelType.TEXT_SERVER && channel.serverId) {
      // If the channel is part of a server, we need to check if the user is part of the server
      // then we will perform other authorization checks
      const isPresent = await this.serverService.userPartOfServer(payload.sub!, channel.serverId!)
      if (!isPresent) return false
      const userPermissions = await this.memberService.getPermissionsFromChannel(
        payload.sub!,
        channelId
      )
      if (
        !this.permissionsService.validate_permissions(userPermissions, [Permissions.VIEW_CHANNELS])
      )
        return false
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
  async store(payload: JwtPayload, channelId: string) {
    const userPermissions = await this.memberService.getPermissionsFromChannel(
      payload.sub!,
      channelId
    )
    return this.permissionsService.validate_permissions(userPermissions, [
      Permissions.SEND_MESSAGES,
    ])
  }

  async pin(_payload: JwtPayload, channelId: string) {
    const channel = await this.channelService.findByIdOrFail(channelId)
    if (channel.type == ChannelType.PRIVATE_CHAT) return true
    return true
  }

  async update(payload: JwtPayload, channelId: string, messageId: string) {
    const isUserOwner = await this.messageService.isUserAuthor(messageId, payload.sub!)
    if (isUserOwner) return true
    const userPermissions = await this.memberService.getPermissionsFromChannel(
      payload.sub!,
      channelId
    )
    return this.permissionsService.validate_permissions(userPermissions, [
      Permissions.SEND_MESSAGES,
    ])
  }

  async destroy(payload: JwtPayload, channelId: string, messageId: string) {
    const isUserOwner = await this.messageService.isUserAuthor(messageId, payload.sub!)
    if (isUserOwner) return true
    const userPermissions = await this.memberService.getPermissionsFromChannel(
      payload.sub!,
      channelId
    )
    return (
      this.permissionsService.validate_permissions(userPermissions, [Permissions.SEND_MESSAGES]) ||
      this.permissionsService.validate_permissions(userPermissions, [Permissions.MANAGE_MESSAGES])
    )
  }
}
