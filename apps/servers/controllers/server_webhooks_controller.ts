import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import WebhookService from '#apps/webhooks/service/webhook_service'
import ServerWebhookPolicy from '../policies/server_webhook_policy.js'
import { createWebhookValidator } from '#apps/webhooks/validators/webhook'
@inject()
export default class ServerWebhooksController {
  constructor(private webhookService: WebhookService) {}

  // Creates a webhook in a channel
  async createWebhook({ request, params, response, bouncer }: HttpContext) {
    const receivedWebhook = await request.validateUsing(createWebhookValidator)

    await bouncer.with(ServerWebhookPolicy).authorize('create' as never, params.serverId)
    const ownerId = params.ownerId
    const channelId = params.channelId
    const channel = await this.webhookService.create(receivedWebhook, ownerId, channelId)
    return response.created(channel)
  }

  // Updates a webhook in a channel
  async updateWebhook({ request, params, response, bouncer }: HttpContext) {
    const receivedWebhook = await request.validateUsing(createWebhookValidator)
    await bouncer.with(ServerWebhookPolicy).authorize('update' as never, params.serverId)
    const webhookId = params.webhookId
    const webhook = await this.webhookService.update(receivedWebhook, webhookId)
    return response.ok(webhook)
  }

  // List all webhooks in a channel
  async findByChannelId({ params, bouncer }: HttpContext) {
    await bouncer.with(ServerWebhookPolicy).authorize('create' as never, params.serverId)

    const channelId = params.channelId
    const webhooks = await this.webhookService.findAllByChannelId(channelId)
    return webhooks
  }

  // List all webhooks in a server
  async findByServerId({ params, bouncer }: HttpContext) {
    await bouncer.with(ServerWebhookPolicy).authorize('create' as never, params.serverId)

    const serverId = params.serverId
    const webhooks = await this.webhookService.findAllByServerId(serverId)
    return webhooks
  }

  // List the webhook by ID
  async findByWebhookId({ params, bouncer }: HttpContext) {
    await bouncer.with(ServerWebhookPolicy).authorize('create' as never, params.serverId)

    const webhookId = params.webhookId
    const webhook = await this.webhookService.findById(webhookId)
    return webhook
  }

  // Deletes a webhook in a channel
  async deleteWebhook({ params, bouncer }: HttpContext) {
    await bouncer.with(ServerWebhookPolicy).authorize('delete' as never, params.serverId)

    const webhookId = params.webhookId
    await this.webhookService.delete(webhookId)
  }
}
