import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import ChannelService from '#apps/channels/services/channel_service'
import Channel from '#apps/channels/models/channel'
import {
  createChannelValidator,
  indexChannelValidator,
  showChannelValidator,
  joinChannelValidator,
  updateChannelValidator,
} from '#apps/channels/validators/channel'
import transmit from '@adonisjs/transmit/services/main'
import { Payload } from '#apps/authentication/contracts/payload'

@inject()
export default class ChannelsController {
  constructor(private channelService: ChannelService) {}

  /**
   * Display a list of resource
   */
  async index({ request }: HttpContext) {
    const data = await request.validateUsing(indexChannelValidator)
    /*if (!data.onlyAccess) {
      await bouncer.with(ChannelPolicy).authorize('index' as never)
      const channels = await this.channelService.findAll(data)
      return response.send(channels)
    } else if (userPayload?.sub) {
      logger.info(`Fetch channels for user ${userPayload.sub}`)
      return response.send(
        await this.channelService.findAllForUser(userPayload.sub.toString(), data)
      )
    }*/

    return this.channelService.findAll(data)

    //return response.abort('A problem occurred while fetching channels')
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, params, auth }: HttpContext) {
    const payload = await request.validateUsing(createChannelValidator)
    const userId = auth.use('jwt').payload!.sub as string

    // Get server with ServerService and check if user is allowed to create a channel
    const channel: Channel = await this.channelService.create(payload, params.serverId)

    await this.channelService.join(userId, channel.id)

    transmit.broadcast('channels/action', {
      message: 'A new channel has been created',
    })

    return response.send(channel)
  }

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

  /**
   * Show individual record
   */
  async show({ request, response }: HttpContext) {
    const data = await request.validateUsing(showChannelValidator)
    //await bouncer.with(ChannelPolicy).authorize('show' as never)
    const channel: Channel = await this.channelService.findById(data)
    return response.send(channel)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ request, response }: HttpContext) {
    const payload = await request.validateUsing(updateChannelValidator)

    const channel: Channel = await this.channelService.update(payload)

    return response.send(channel)
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    const channelId: string = params.id

    await this.channelService.deleteById(channelId)

    transmit.broadcast('channels/action', {
      message: 'A channel has been deleted',
    })
    return response.send('channel has been deleted')
  }
}
