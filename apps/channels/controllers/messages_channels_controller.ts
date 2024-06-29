import MessagePolicy from '#apps/messages/policies/message_policy'
import MessageService from '#apps/messages/services/message_service'
import { createMessageValidator, updateMessageValidator } from '#apps/messages/validators/message'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import transmit from '@adonisjs/transmit/services/main'
import ServerService from '#apps/servers/services/server_service'
import ChannelService from '#apps/channels/services/channel_service'
import { ShowChannelSchema } from '#apps/channels/validators/channel'

@inject()
export default class MessagesChannelsController {
  constructor(
    private messageService: MessageService,
    private channelService: ChannelService,
    private serverService: ServerService
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
  async pin({ params, bouncer }: HttpContext) {
    const channelId = params.channelId
    const messageId = params.messageId
    const message = await this.messageService.show(messageId)
    const channel = await this.channelService.findById({
      params: { id: channelId },
      messages: undefined,
      users: undefined,
    })
    const server = await this.serverService.findById(channel.serverId)
    await bouncer.with(MessagePolicy).authorize('pin' as never, message, server)
    transmit.broadcast(`channels/${params.channelId}/messages`, {
      messageId: params.messageId,
    })
    return this.messageService.pin(messageId)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request, params }: HttpContext) {
    const payload = auth.use('jwt').payload
    const channelId = params.channelId

    const data = await request.validateUsing(createMessageValidator)
    transmit.broadcast(`channels/${params.channelId}/messages`, {
      messageId: params.messageId,
    })
    return this.messageService.create(data, payload!.sub as string, channelId)
  }

  /**
   * Handle form submission for the update action
   */
  async update({ request, params, bouncer }: HttpContext) {
    const messageId = params.messageId
    const receivedMessage = await request.validateUsing(updateMessageValidator)
    const message = await this.messageService.show(messageId)
    await bouncer.with(MessagePolicy).authorize('edit' as never, message)
    transmit.broadcast(`channels/${params.channelId}/messages`, {
      messageId: messageId,
    })
    return this.messageService.update(receivedMessage, messageId)
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    console.log('in message service show')
    const messageId: string = params.messageId
    return this.messageService.show(messageId)
  }

  /**
   * Delete record
   */
  async destroy({ params, bouncer }: HttpContext) {
    const messageId = params.messageId
    const message = await this.messageService.show(messageId)

    let showChannelSchema: ShowChannelSchema = {
      params: {
        id: message.channelId,
      },
      users: true,
      messages: undefined,
    }
    const channel = await this.channelService.findById(showChannelSchema)

    const server = await this.serverService.findById(channel.serverId)
    await bouncer.with(MessagePolicy).authorize('delete' as never, message, server)
    transmit.broadcast(`channels/${params.channelId}/messages`, {
      messageId: params.messageId,
    })
    return this.messageService.destroy(messageId)
  }

  /**
   * Find and delete a message knowuing the content 'Le message avec l'ID ${message.id} a été épinglé.'
   */
  async findAndDelete({ params }: HttpContext) {
    const messageId = params.messageId
    const content = 'The message with ID ' + messageId + ' is pinned.'
    return this.messageService.findAndDelete(content)
  }
}
