import BadPinningException from '#apps/channels/exceptions/bad_pinning_exception'
import ChannelNotFoundException from '#apps/channels/exceptions/channel_not_found_exception'
import Channel from '#apps/channels/models/channel'
import Message from '#apps/messages/models/message'
import { ActionSignalMessage, SignalMessage } from '#apps/messages/models/signaling'

import {
  CreateMessagesSchema,
  GetMessagesValidator,
  PinMessagesSchema,
  UpdateMessagesSchema,
} from '#apps/messages/validators/message'
import StorageService from '#apps/storage/services/storage_service'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'

@inject()
export default class MessageService {
  constructor(protected storageService: StorageService) {}

  extractMentionsFromMessage(message: string): string[] {
    const mentions = message.match(/@(\S+)/g)
    return mentions ? mentions : []
  }

  async findAll() {
    return Message.query()
  }

  async findPinned(channelId: string) {
    await Channel.findOrFail(channelId).catch(() => {
      throw new ChannelNotFoundException('Channel not found', {
        code: 'E_CHANNEL_NOT_FOUND',
        status: 404,
      })
    })

    return Message.query()
      .where('channelId', channelId)
      .where('pinned', true)
      .preload('owner')
      .orderBy('created_at', 'desc')
  }

  async pinning(messageId: string, pinningRequest: PinMessagesSchema, userId: string) {
    const displayedMessage = 'I just pinned a message !'
    const isPinnning = pinningRequest.action === 'pin'
    const message = await Message.findOrFail(messageId)
    if (isPinnning !== message.pinned) {
      message.pinned = isPinnning
      await this.create(
        {
          content: displayedMessage,
          attachments: undefined,
          parentMessageId: undefined,
          transmitClientId: undefined,
        },
        userId,
        message.channelId
      )
      await this.update(message, message.id)
    } else if (isPinnning) {
      throw new BadPinningException('Message is already pinned', { status: 409 })
    } else {
      throw new BadPinningException('Message is already unpinned', { status: 409 })
    }

    return message
  }

  async create(message: CreateMessagesSchema, ownerId: string, channelId: string) {
    console.log('message creation')
    const messageCreationTransaction = await db.transaction()
    let createdMessage = new Message()

    try {
      createdMessage = await Message.create(
        {
          content: message.content,
          parentMessageId: message.parentMessageId,
          ownerId: ownerId,
          channelId: channelId,
        },
        { client: messageCreationTransaction }
      )

      if (message.attachments) {
        await Promise.all(
          message.attachments.map(async (attachment) => {
            const key =
              createdMessage.channelId + '/' + createdMessage.id + '/' + attachment.clientName
            console.log('key before', key)
            await attachment.moveToDisk(key)
            console.log('key after', key)
            return await createdMessage.related('attachments').create({
              name: key,
              contentType: attachment.headers['content-type'],
              messageId: createdMessage.id,
            })
          })
        )
      }
      await messageCreationTransaction.commit()
    } catch (error) {
      await messageCreationTransaction.rollback()
      throw error
    }

    await createdMessage.load('attachments')

    await createdMessage.load('owner', (query) => {
      query.select('id', 'username', 'profilePicture')
    })

    if (message.parentMessageId)
      await createdMessage.load('parentMessage', (query) => {
        query.preload('owner', (query) => {
          query.select('id', 'username', 'profilePicture')
        })
      })

    const signalMessage: SignalMessage = {
      message: createdMessage,
      action: ActionSignalMessage.create,
    }
    if (message.transmitClientId !== undefined) {
      signalMessage.transmitClientId = message.transmitClientId
    }
    transmit.broadcast(`channels/${channelId}/messages`, JSON.stringify(signalMessage))
    return createdMessage
  }

  async show(id: string) {
    return Message.query()
      .preload('attachments')
      .preload('owner', (query) => {
        query.select('id', 'username')
      })
      .where('id', id)
      .firstOrFail()
  }

  async update(updatedMessage: UpdateMessagesSchema, messageId: string) {
    const message = await Message.findOrFail(messageId)
    await message.merge(updatedMessage).save()
    const signalMessage: SignalMessage = {
      message: message,
      action: ActionSignalMessage.update,
    }
    transmit.broadcast(`channels/${message.channelId}/messages`, JSON.stringify(signalMessage))
    return message
  }

  async destroy(id: string) {
    const message = await Message.findOrFail(id)
    const signalMessage: SignalMessage = {
      message: message,
      action: ActionSignalMessage.delete,
    }
    transmit.broadcast(`channels/${message.channelId}/messages`, JSON.stringify(signalMessage))
    return message.delete()
  }

  findAllByChannelId(channelId: string) {
    return Message.query()
      .where('channelId', channelId)
      .preload('parentMessage', (query) => {
        query.preload('owner', (query) => {
          query.select('id', 'username', 'profilePicture')
        })
      })
      .orderBy('created_at', 'desc')
  }

  async getPaginated(channelId: string, options?: GetMessagesValidator) {
    const limit = options?.limit ?? 100

    const baseQuery = Message.query()
      .where('channelId', channelId)
      .preload('attachments')
      .preload('owner', (query) => {
        query.select('id', 'username', 'profilePicture')
      })
      .preload('parentMessage', (query) => {
        query.preload('owner', (query) => {
          query.select('id', 'username', 'profilePicture')
        })
      })
      .orderBy('created_at', 'desc')
      .limit(limit)

    if (options?.before) {
      const beforeMessage = await Message.findByOrFail('id', options.before)
      return baseQuery.where('created_at', '<', beforeMessage.createdAt.toString()).exec()
    }

    return baseQuery.exec()
  }

  setSignalingChannel(userId: string, transmitId: string) {
    redis.setex(`signalingChannel:${userId}`, transmitId, 3600)
  }

  async isUserAuthor(messageId: string, userId: string) {
    const message = await Message.find(messageId)
    return message?.ownerId === userId
  }
}
