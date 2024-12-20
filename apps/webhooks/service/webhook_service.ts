import { ActionSignalWebhook, SignalWebhook } from '#apps/webhooks/models/signaling'
import { UpdateWebhookSchema, CreateWebhooksSchema } from '#apps/webhooks/validators/webhook'
import StorageService from '#apps/storage/services/storage_service'
import { inject } from '@adonisjs/core'
import transmit from '@adonisjs/transmit/services/main'
import { randomUUID } from 'crypto'
import Webhook from '#apps/webhooks/models/webhook'
import WebhookAlreadyExistsException from '../exceptions/webhook_already_exists_exception.js'
import WebhookNotFoundException from '../exceptions/webhook_not_found_exception.js'

@inject()
export default class WebhookService {
  constructor(protected storageService: StorageService) {}

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
      token: webhook.token || randomUUID(),
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
}
