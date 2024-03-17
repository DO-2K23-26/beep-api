import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import MessageService from '#apps/messages/services/message_service'
import { createMessageValidator, updateMessageValidator } from '#apps/messages/validators/message'
import StorageService from '#apps/storage/services/storage_service'
import { CreateStorageSchema, UpdateStorageSchema } from '#apps/storage/validators/storage'
import Attachment from '#apps/storage/models/attachment'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import transmit from "@adonisjs/transmit/services/main";
import MessagePolicy from '#apps/messages/policies/message_policy'
import Message from '#apps/messages/models/message'
@inject()
export default class MessagesController {
  constructor(
    private messageService: MessageService,
    private storageService: StorageService
  ) {}

  /**
   * Display a list of resource
   */
  async index({ params }: HttpContext) {
    const channelId: string | undefined = params.channelId

    if (channelId) {
      return this.messageService.findAllByChannelId(channelId)
    }

    return this.messageService.findAll()
  }

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request }: HttpContext) {
    const payload = auth.use('jwt').payload
    const data = await request.validateUsing(createMessageValidator)
    const message = await this.messageService.create({ validated: data, ownerId: payload!.sub as string })

    console.log(request.body())
    if (data.attachments) {
      console.log(data.attachments)
      for (let attachment of data.attachments) {
        const dataAttachments: CreateStorageSchema = {
          messageId: message.id,
          attachment: attachment,
        }
        await this.storageService.store(dataAttachments)
      }
    }

    transmit.broadcast(`channels/${data.channelId}/messages`, {
      message: 'new message'
    })
    return this.messageService.show(message.id)
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    const message = await this.messageService.show(params.id)
    return { message }
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ bouncer, auth, params, request }: HttpContext) {
    const payload = auth.use('jwt').payload
    if (!(payload && typeof payload.sub === 'string')) {
      return { error: 'User not found' }
    }
    const data = await request.validateUsing(updateMessageValidator)
    await bouncer.with(MessagePolicy).authorize('edit' as never)
    await this.messageService.update(data)
    const newMessage = await this.messageService.show(params.id)
    const attachments: Attachment[] = newMessage.attachments
    const storageService = new StorageService()
    if (!data.attachments) {
      for (const attachment of attachments) {
        await storageService.destroy(attachment.id)
      }
      return this.messageService.show(params.id)
    }
    for (const attachment of data.attachments) {
      const attachmentToUpdate = attachments.find(
        (a: Attachment) =>
          newMessage.channelId + '/' + newMessage.id + '/' + attachment.clientName === a.name
      )
      if (attachmentToUpdate) {
        const dataAttachments: UpdateStorageSchema = {
          params: {
            id: attachmentToUpdate.id,
          },
          attachment: attachment,
        }
        await storageService.update(dataAttachments)
      } else {
        const dataAttachments: CreateStorageSchema = {
          messageId: newMessage.id,
          attachment: attachment,
        }
        await storageService.store(dataAttachments)
        console.log('okay')
      }
    }
    for (const attachment of attachments) {
      if (
        !data.attachments.find(
          (a: MultipartFile) =>
            newMessage.channelId + '/' + newMessage.id + '/' + a.clientName === attachment.name
        )
      ) {
        await storageService.destroy(attachment.id)
      }
    }
    return this.messageService.show(params.id)
  }

  /**
   * Delete record
   */
  async destroy({ bouncer, params }: HttpContext) {
    const owner = await Message.findOrFail(params.id)
    await bouncer.with(MessagePolicy).authorize('delete' as never)
    return this.messageService.destroy(owner.ownerId)
  }
}
