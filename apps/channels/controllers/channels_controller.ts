import { Payload } from '#apps/authentication/contracts/payload'
import ChannelService from '#apps/channels/services/channel_service'
import { joinChannelValidator } from '#apps/channels/validators/channel'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ChannelsController {
  constructor(private channelService: ChannelService) {}

  /**
   * Subscribe to a channel
   */
  async join({ auth, params, response }: HttpContext) {
    const jwtPayload = auth.use('jwt').payload as unknown as Payload

    const channel = await this.channelService.findById(params.id)
    await this.channelService.join(jwtPayload.sub, channel.id)
    return response.send(channel)
  }

  async leave({ auth, request, response }: HttpContext) {
    const userPayload = auth.use('jwt').payload
    if (!userPayload?.sub) {
      return response.abort('no user connected')
    }

    const data = await request.validateUsing(joinChannelValidator)

    await this.channelService.leave(userPayload.sub.toString(), data)

    return response.ok('You have left the channel')
  }
}
