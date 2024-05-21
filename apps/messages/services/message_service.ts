import Message from '#apps/messages/models/message'
import User from '#apps/users/models/user'
import { CreateMessagesSchema, UpdateMessagesSchema } from '#apps/messages/validators/message'
import Attachment from '#apps/storage/models/attachment'
import StorageService from '#apps/storage/services/storage_service'
import { CreateStorageSchema, UpdateStorageSchema } from '#apps/storage/validators/storage'
import { inject } from '@adonisjs/core'
import { MultipartFile } from '@adonisjs/core/bodyparser'

@inject()
export default class MessageService {
  constructor(protected storageService: StorageService) {}

  async findAll() {
    return Message.query()
  }

  async create(message: CreateMessagesSchema, ownerId: string, channelId: string) {
    const createdMessage = await Message.create({
      ...message,
      ownerId: ownerId,
      channelId: channelId,
    })
    console.log(createdMessage.attachments)
    if (message.attachments) {
      console.log('attachment')
      for (let attachment of message.attachments) {
        const dataAttachments: CreateStorageSchema = {
          messageId: createdMessage.id,
          attachment: attachment,
        }
        await this.storageService.store(dataAttachments, createdMessage)
      }
    } else {
      console.log('no attachments')
    }
    return createdMessage
  }

  show(id: string) {
    console.log('preload')
    return Message.query().preload('attachments').where('id', id).firstOrFail()
  }

  async update(updatedMessage: UpdateMessagesSchema, messageId: string) {
    const message = await Message.findOrFail(messageId)
    await message.merge(updatedMessage).save()
    this.updateFilesOfMessage(message, updatedMessage)
    return message
  }

  destroy(id: string) {
    return Message.query().where('id', id).delete()
  }

  findAllByChannelId(channelId: string) {
    return Message.query()
      .where('channelId', channelId)
      .preload('owner', (ownerQuery) => {
        ownerQuery.select('id', 'username', 'profilePicture')
      })
      .orderBy('created_at', 'desc')
  }
  

  async updateFilesOfMessage(
    updatedMessage: Message,
    providedMessage: UpdateMessagesSchema
  ): Promise<Attachment[] | null> {
    const messageWithAttachements = await this.show(updatedMessage.id)
    const attachments: Attachment[] = messageWithAttachements.attachments
    let updatedAttachement: Attachment[] = []
    console.log(!providedMessage.attachments && attachments !== undefined)
    // If no attachements provided delete all old attchements and stop the function
    if (!providedMessage.attachments && attachments !== undefined) {
      for (const attachment of attachments) {
        await this.storageService.destroy(attachment.id)
      }
      return null
    }

    //This part allow us to update if the attachements already exists
    //If not it will be created
    if (providedMessage.attachments) {
      for (const attachment of providedMessage.attachments) {
        const attachmentToUpdate = attachments.find(
          (a: Attachment) =>
            updatedMessage.channelId + '/' + updatedMessage.id + '/' + attachment.clientName ===
            a.name
        )
        if (attachmentToUpdate) {
          const dataAttachments: UpdateStorageSchema = {
            params: {
              id: attachmentToUpdate.id,
            },
            attachment: attachment,
          }
          updatedAttachement.push(await this.storageService.update(dataAttachments))
        } else {
          const dataAttachments: CreateStorageSchema = {
            messageId: updatedMessage.id,
            attachment: attachment,
          }
          updatedAttachement.push(await this.storageService.store(dataAttachments, updatedMessage))
        }
      }

      //Delete old attachements that aren't linked to the message anymore
      if (attachments !== undefined) {
        for (const attachment of attachments) {
          if (
            !providedMessage.attachments.find(
              (a: MultipartFile) =>
                updatedMessage.channelId + '/' + updatedMessage.id + '/' + a.clientName ===
                attachment.name
            )
          ) {
            await this.storageService.destroy(attachment.id)
          }
        }
      }
    }
    return updatedAttachement
  }
}
