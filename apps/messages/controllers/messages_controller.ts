import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import MessageService from '#apps/messages/services/message_service'
import { createMessageValidator, updateMessageValidator } from '#apps/messages/validators/message'
import StorageService from '#apps/storage/services/storage_service'
import { CreateStorageSchema, UpdateStorageSchema } from '#apps/storage/validators/storage'
import Attachment from '#apps/storage/models/attachment'
import { MultipartFile } from '@adonisjs/core/bodyparser'
@inject()
export default class MessagesController {
  constructor(private messageService: MessageService) {
    this.messageService = messageService
  }

  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {
    return this.messageService.findAll()
  }

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request }: HttpContext) {
    const payload = auth.use('jwt').payload
    if (!(payload && typeof payload.sub === 'string')) {
      return { error: 'User not found' }
    }
    const data = await request.validateUsing(createMessageValidator, {
      meta: {
        ownerId: payload.sub,
      },
    })
    const message = await this.messageService.create(data)
    if (data.attachments) {
      const storageService = new StorageService()
      for (let attachment of data.attachments) {
        const dataAttachments: CreateStorageSchema = {
          messageId: message.id,
          attachment: attachment,
        }
        await storageService.store(dataAttachments)
      }
    }
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
  async update({ auth, params, request }: HttpContext) {
    const payload = auth.use('jwt').payload
    if (!(payload && typeof payload.sub === 'string')) {
      return { error: 'User not found' }
    }
    const data = await request.validateUsing(updateMessageValidator, {
      meta: {
        ownerId: payload.sub,
      },
    })
    await this.messageService.update(data)
    const newMessage = await this.messageService.show(params.id)
    const attachments: Attachment[] = newMessage.attachments
    const storageService = new StorageService()
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
  async destroy({ params }: HttpContext) {
    return this.messageService.destroy(params.id)
  }
}
