import { ActionSignalWebhook, SignalWebhook } from '#apps/webhooks/models/signaling'
import { UpdateWebhookSchema, CreateWebhooksSchema } from '#apps/webhooks/validators/webhook'
import StorageService from '#apps/storage/services/storage_service'
import { inject } from '@adonisjs/core'
import transmit from '@adonisjs/transmit/services/main'
import Webhook from '#apps/webhooks/models/webhook'
import WebhookAlreadyExistsException from '../exceptions/webhook_already_exists_exception.js'
import WebhookNotFoundException from '../exceptions/webhook_not_found_exception.js'
import Message from '#apps/messages/models/message'
import { ActionSignalMessage, SignalMessage } from '#apps/messages/models/signaling'
import env from '#start/env'
import jwt from 'jsonwebtoken'
import WebhookJwtInvalidException from '../exceptions/webhook_jwt_invalid_exception.js'
import AuthenticationService from '#apps/authentication/services/authentication_service'
import User from '#apps/users/models/user'

export interface PayloadJWTSFUConnection {
  name?: string
}

@inject()
export default class WebhookService {
  constructor(protected storageService: StorageService) {}
  authService = new AuthenticationService()

  async create(webhook: CreateWebhooksSchema, ownerId: string, channelId: string) {
    // Vérifiez si un webhook avec le même nom existe déjà dans le canal
    const existingWebhook = await Webhook.query()
      .where('name', webhook.name)
      .andWhere('channelId', channelId)
      .first()

    if (existingWebhook) {
      throw new WebhookAlreadyExistsException(
        'Webhook with this name already exists in the channel',
        {
          status: 400,
          code: 'E_WEBHOOK_ALREADY_EXISTS',
        }
      )
    }

    // Création du webhook
    const createdWebhook = await Webhook.create({
      name: webhook.name,
      profilePicture: webhook.profilePicture || 'https://beep.baptistebronsin.be/logo.png',
      token: this.generateToken({ name: webhook.name }),
      userId: ownerId,
      channelId: channelId,
      serverId: webhook.serverId || null,
    })

    // Diffusion de l'événement
    const signalWebhook: SignalWebhook = {
      webhook: createdWebhook,
      action: ActionSignalWebhook.create,
    }

    transmit.broadcast(`channels/${channelId}/webhook`, JSON.stringify(signalWebhook))

    return createdWebhook
  }

  async update(updatedWebhook: UpdateWebhookSchema, webhookId: string) {
    // Vérifiez si le webhook existe
    const webhook = await Webhook.find(webhookId)
    if (!webhook) {
      throw new WebhookNotFoundException('Webhook not found', {
        status: 404,
        code: 'E_WEBHOOK_NOT_FOUND',
      })
    }

    // Mise à jour du webhook
    try {
      await webhook.merge(updatedWebhook).save()
    } catch (error) {
      if (error.code === '23505') {
        // Gestion des contraintes DB
        throw new WebhookAlreadyExistsException(
          'Another webhook with this name already exists in the channel',
          {
            status: 400,
            code: 'E_WEBHOOK_NAME_CONFLICT',
          }
        )
      }
      throw error
    }

    // Diffusion de l'événement
    const signalWebhook: SignalWebhook = {
      webhook: webhook,
      action: ActionSignalWebhook.update,
    }

    transmit.broadcast(`channels/${webhook.channelId}/messages`, JSON.stringify(signalWebhook))

    return webhook
  }

  async findAllByChannelId(channelId: string) {
    return Webhook.query().where('channelId', channelId).orderBy('created_at', 'desc')
  }

  async findAllByServerId(serverId: string) {
    return Webhook.query().where('serverId', serverId).orderBy('created_at', 'desc')
  }

  async findById(webhookId: string) {
    const webhook = await Webhook.find(webhookId)

    if (!webhook) {
      throw new WebhookNotFoundException('Webhook not found', {
        status: 404,
        code: 'E_WEBHOOK_NOT_FOUND',
      })
    }

    return webhook
  }

  // Supprime un webhook et tous les messages associés
  async delete(webhookId: string) {
    // Trouver le webhook
    const webhook = await Webhook.findOrFail(webhookId)

    // Supprimer les messages associés
    // const messages = await Message.query().where('webhookId', webhookId)
    const messages = await Message.findManyBy('webhookId', webhookId)
    for (const message of messages) {
      const signalMessage: SignalMessage = {
        message: message,
        action: ActionSignalMessage.delete,
      }
      transmit.broadcast(`channels/${message.channelId}/messages`, JSON.stringify(signalMessage))
      await message.delete()
    }

    // Supprimer le webhook
    await webhook.delete()
    return webhook
  }

  async trigger(webhookId: string, messageContent: string) {
    // Find the webhook by ID
    const webhook = await Webhook.findOrFail(webhookId)

    // Validate the webhook token with AuthenticationService.verifyToken
    try {
      if (webhook.token) {
        console.log(webhook.token)
        jwt.verify(webhook.token, env.get('APP_KEY'))
      } else {
        console.log('Webhook token is empty')
      }
      // this.authService.verifyToken(webhook.token ?? '')
    } catch (err) {
      throw new WebhookJwtInvalidException(err, {
        status: 404,
        code: 'E_WEBHOOK_INVALID_JWT',
      })
    }

    if (!webhook.userId) {
      throw new Error('Webhook userId is missing or invalid')
    }

    // Optionally: Ensure the user exists in the database
    const userExists = await User.find(webhook.userId)
    if (!userExists) {
      throw new Error(`User with ID ${webhook.userId} does not exist`)
    }

    console.log('AVANT CREATION MESSAGE')

    // Create the message
    const createdMessage = await Message.create({
      content: messageContent,
      webhookId: webhook.id,
      channelId: webhook.channelId,
      ownerId: webhook.userId,
    })

    console.log('APRES CREATION MESSAGE')

    console.log('Created message:', createdMessage)

    // Construct the payload for the broadcast
    const signalWebhook: SignalWebhook = {
      webhook: webhook,
      action: ActionSignalWebhook.trigger,
      message: createdMessage.content,
    }

    // Broadcast the webhook event to the channel
    transmit.broadcast(`channels/${webhook.channelId}/webhook`, JSON.stringify(signalWebhook))

    return {
      webhook,
      message: createdMessage,
      status: 'Webhook triggered and message created successfully',
    }
  }

  generateToken(payload: PayloadJWTSFUConnection): string {
    return jwt.sign(payload, env.get('APP_KEY'))
  }
}
