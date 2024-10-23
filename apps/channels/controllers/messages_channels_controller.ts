import ChannelService from '#apps/channels/services/channel_service'
import { ShowChannelSchema } from '#apps/channels/validators/channel'
import MessagePolicy from '#apps/messages/policies/message_policy'
import MessageService from '#apps/messages/services/message_service'
import {
  createMessageValidator,
  pinMessageValidator,
  updateMessageValidator,
} from '#apps/messages/validators/message'
import ServerService from '#apps/servers/services/server_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class MessagesChannelsController {
  constructor(
    private readonly messageService: MessageService,
    private readonly channelService: ChannelService,
    private readonly serverService: ServerService
  ) {}
  /**
   * Display a list of resource
   */
  async index({ params }: HttpContext) {
    const channelId: string = params.channelId
    return this.messageService.findAllByChannelId(channelId)
  }

  /**
   * Get all pinned messages from a channel
   */
  async pinned({ params }: HttpContext) {
    const channelId: string = params.channelId
    return this.messageService.findPinned(channelId)
  }

  /**
   * Pin a message
   */
  async pin({ params, bouncer, request, auth, response }: HttpContext) {
    const payload = auth.use('jwt').payload
    const channelId = params.channelId
    const messageId = params.messageId
    const req = await request.validateUsing(pinMessageValidator)
    await bouncer.with(MessagePolicy).authorize('pin' as never, messageId, channelId)
    const message = await this.messageService.pinning(messageId, req, payload!.sub as string)
    return response.send(message)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request, params }: HttpContext) {
    const payload = auth.use('jwt').payload
    const channelId = params.channelId

    const data = await request.validateUsing(createMessageValidator)
    const newMessage = await this.messageService.create(data, payload!.sub as string, channelId)

    return newMessage
  }

  /**
   * Handle form submission for the update action
   */
  async update({ request, params, bouncer }: HttpContext) {
    const messageId = params.messageId
    const receivedMessage = await request.validateUsing(updateMessageValidator)
    const message = await this.messageService.show(messageId)
    await bouncer.with(MessagePolicy).authorize('edit' as never, message)
    const updatedMessage = await this.messageService.update(receivedMessage, messageId)

    return updatedMessage
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    const messageId: string = params.messageId
    return this.messageService.show(messageId)
  }

  /**
   * Delete record
   */
  async destroy({ params, bouncer }: HttpContext) {
    const messageId = params.messageId
    const message = await this.messageService.show(messageId)

    const showChannelSchema: ShowChannelSchema = {
      params: {
        id: message.channelId,
      },
      users: true,
      messages: undefined,
    }
    const channel = await this.channelService.findById(showChannelSchema)

    const server = await this.serverService.findById(channel.serverId)
    await bouncer.with(MessagePolicy).authorize('delete' as never, message, server)

    return this.messageService.destroy(messageId)
  }
}
