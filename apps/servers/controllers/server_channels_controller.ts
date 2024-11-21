import { Payload } from '#apps/authentication/contracts/payload'
import ChannelService from '#apps/channels/services/channel_service'
import { createChannelValidator, updateChannelValidator } from '#apps/channels/validators/channel'
import ServerChannelPolicy from '#apps/servers/policies/server_channel_policy'
import { mutedValidator } from '#apps/users/validators/muted_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ServerChannelsController {
  constructor(private channelService: ChannelService) {}

  //recupere les channels d'un server
  async findByServerId({ params, bouncer }: HttpContext) {
    await bouncer.with(ServerChannelPolicy).authorize('view' as never, params.serverId)
    return this.channelService.findAllByServer(params.serverId)
  }

  async findByChannelId({ params, bouncer }: HttpContext) {
    await bouncer.with(ServerChannelPolicy).authorize('view' as never, params.serverId)
    return this.channelService.findByIdOrFail(params.channelId)
  }

  // Creates a channel in a server
  async createChannel({ auth, request, params, response, bouncer }: HttpContext) {
    const receivedChannel = await request.validateUsing(createChannelValidator)
    await bouncer.with(ServerChannelPolicy).authorize('create' as never, params.serverId)
    const userPayload = auth.use('jwt').payload as Payload
    const serverId = params.serverId
    const channel = await this.channelService.create(receivedChannel, serverId, userPayload.sub)
    return response.created(channel)
  }

  // Updates a chan (name, description...)
  async updateChannel({ request, params, response, bouncer }: HttpContext) {
    const receivedChannel = await request.validateUsing(updateChannelValidator)
    await bouncer.with(ServerChannelPolicy).authorize('update' as never, params.serverId)
    const channel = await this.channelService.update(params.channelId, receivedChannel)
    return response.send(channel)
  }

  // Deletes a channel from a server
  async deleteChannel({ params }: HttpContext) {
    const channelId = params.channelId
    await this.channelService.deleteById(channelId)
    return { message: 'Channel deleted successfully' }
  }

  async joinChannel({ auth, params, request }: HttpContext): Promise<string> {
    const userPayload = auth.use('jwt').payload as Payload
    const channelId = params.channelId
    const serverId = params.serverId
    const payload = await request.validateUsing(mutedValidator)
    const token = await this.channelService.joinVoiceChannel(
      serverId,
      channelId,
      userPayload.sub.toString(),
      userPayload.username,
      payload
    )
    return JSON.stringify({ token: token })
  }

  async leaveChannel({ auth }: HttpContext): Promise<string> {
    const userPayload = auth.use('jwt').payload as Payload
    const token = await this.channelService.quitVoiceChannel(userPayload.sub.toString())
    return JSON.stringify({ token: token })
  }

  streamingUsers({ params }: HttpContext) {
    return this.channelService.occupiedVoiceChannels(params.serverId)
  }

  async changeMutedStatus({ auth, params, request }: HttpContext) {
    const userPayload = auth.use('jwt').payload as Payload
    const payload = await request.validateUsing(mutedValidator)
    await this.channelService.changeMutedStatus(
      userPayload.sub.toString(),
      params.serverId,
      payload
    )
    return 'ok'
  }
}
