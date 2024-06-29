import { HttpContext } from '@adonisjs/core/http'
import ChannelService from '#apps/channels/services/channel_service'
import { inject } from '@adonisjs/core'
import AttachmentService from '#apps/channels/services/attachment_service'

@inject()
export default class AttachmentsChannelController {
  constructor(
    protected channelService: ChannelService,
    protected attachmentService: AttachmentService
  ) {}

  async index({ params, request }: HttpContext) {
    const { channelId } = params
    const { page, limit } = request.qs()

    return this.attachmentService.findByChannelId(channelId, {
      page,
      limit,
    })
  }
}
