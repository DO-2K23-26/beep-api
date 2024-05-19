import { Payload } from '#apps/authentication/contracts/payload'
import ChannelService from '#apps/channels/services/channel_service'
import { createChannelValidator } from '#apps/channels/validators/channel'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ServerChannelsController {
  constructor(private channelService: ChannelService) {}

  //recupere les channels d'un server
  async findByServerId({ params }: HttpContext) {
    return this.channelService.findAllByServer(params.serverId)
  }

  async findByChannelId({ params }: HttpContext) {
    return this.channelService.findById({ params: { id: params.channelId as string }, messages: undefined, users: undefined })
  }

  // permet de créer un channel dans un serveur
  async createChannel({ auth, request, params }: HttpContext) {
    const receivedChannel = await request.validateUsing(createChannelValidator)
    const type = receivedChannel.type as 'voice' | 'text'
    const userPayload = auth.use('jwt').payload as Payload
    const serverId = params.serverId
    const channel = await this.channelService.create(
      { name: receivedChannel.name, type: type },
      serverId
    )
    await this.channelService.join(userPayload.sub, channel.id)
    return channel
  }
}
