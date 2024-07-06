import { Payload } from '#apps/authentication/contracts/payload'
import ChannelService from '#apps/channels/services/channel_service'
import { createChannelValidator, updateChannelValidator } from '#apps/channels/validators/channel'
import UserService from '#apps/users/services/user_service'
import { mutedValidator } from '#apps/users/validators/muted_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ServerChannelsController {
  constructor(
    private channelService: ChannelService,
    private userService: UserService
  ) {}

  //recupere les channels d'un server
  async findByServerId({ params }: HttpContext) {
    return this.channelService.findAllByServer(params.serverId)
  }

  async findByChannelId({ params }: HttpContext) {
    return this.channelService.findById({
      params: { id: params.channelId as string },
      messages: undefined,
      users: undefined,
    })
  }

  // Creates a channel in a server
  async createChannel({ auth, request, params }: HttpContext) {
    const receivedChannel = await request.validateUsing(createChannelValidator)
    const type = receivedChannel.type as 'voice' | 'text'
    const userPayload = auth.use('jwt').payload as Payload
    const serverId = params.serverId
    const channel = await this.channelService.create(
      { name: receivedChannel.name, type: type },
      serverId,
      userPayload.sub
    )
    return channel
  }

  // Updates a chan (name, description...)
  async updateChannel({ request, params }: HttpContext) {
    const receivedChannel = await request.validateUsing(updateChannelValidator)
    const channel = await this.channelService.update(params.channelId, {
      name: receivedChannel.name,
      description: receivedChannel.description,
    })
    return channel // Returns the updated channel.
  }

  // Deletes a channel from a server
  async deleteChannel({ params }: HttpContext) {
    const channelId = params.channelId
    await this.channelService.deleteById(channelId)
    return { message: 'Channel deleted successfully' }
  }

  async joinChannel({ auth, params }: HttpContext): Promise<string> {
    const userPayload = auth.use('jwt').payload as Payload
    const channelId = params.channelId
    const serverId = params.serverId
    const token = await this.channelService.joinVoiceChannel(
      serverId,
      channelId,
      userPayload.sub.toString(),
      userPayload.username
    )
    return token
  }

  async leaveChannel({ auth }: HttpContext): Promise<string> {
    const userPayload = auth.use('jwt').payload as Payload
    const token = await this.channelService.quitVoiceChannel(userPayload.sub.toString())
    return token
  }

  streamingUsers({ params }: HttpContext) {
    return this.channelService.occupiedVoiceChannels(params.serverId)
  }

  async changeMutedStatus({ auth, params, request }: HttpContext) {
    const userPayload = auth.use('jwt').payload as Payload
    const payload = await request.validateUsing(mutedValidator)
    await this.userService.changeMutedStatus(userPayload.sub.toString(), params.serverId, payload)
    return 'ok'
  }
}
