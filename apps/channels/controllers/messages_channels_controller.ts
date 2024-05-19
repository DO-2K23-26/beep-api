import MessagePolicy from '#apps/messages/policies/message_policy'
import MessageService from '#apps/messages/services/message_service'
import { createMessageValidator, updateMessageValidator } from '#apps/messages/validators/message'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class MessagesChannelsController {
  constructor(private messageService: MessageService) {}
  /**
   * Display a list of resource
   */
  async index({ params }: HttpContext) {
    const channelId: string = params.channelId
    return this.messageService.findAllByChannelId(channelId)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request, params }: HttpContext) {
    const payload = auth.use('jwt').payload
    const channelId = params.channelId
    const data = await request.validateUsing(createMessageValidator)
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
    await bouncer.with(MessagePolicy).authorize('delete' as never, message)
    return this.messageService.destroy(messageId)
  }
}
