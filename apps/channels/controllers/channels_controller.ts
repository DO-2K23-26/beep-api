import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import ChannelService from '#apps/channels/services/channel_service'
import Channel from '../models/channel.js'
import {
  createChannelValidator,
  indexChannelValidator,
  showChannelValidator,
  joinChannelValidator,
  updateChannelValidator,
} from '../validators/channel.js'
import transmit from '@adonisjs/transmit/services/main'
import ChannelPolicy from '#apps/channels/policies/channel_policy'

@inject()
export default class ChannelsController {
  constructor(private channelService: ChannelService) {}

  /**
   * Display a list of resource
   */
  async index({ bouncer, request, response, auth }: HttpContext) {
    const data = await request.validateUsing(indexChannelValidator)
    const userPayload = auth.use('jwt').payload
    if (!data.onlyAccess) {
      await bouncer.with(ChannelPolicy).authorize('index' as never)
      return response.send(await this.channelService.findAll(data))
    } else if (userPayload?.sub) {
      return response.send(
        await this.channelService.findAllForUser(userPayload.sub.toString(), data)
      )
    }

    return response.abort('A problem occurred while fetching channels')
  }

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(createChannelValidator)
    const userPayload = auth.use('jwt').payload
    if (!userPayload?.sub) {
      return response.abort('no user connected')
    }

    const channel: Channel = await this.channelService.create(payload)

    await this.channelService.join(userPayload.sub.toString(), { params: { id: channel.id } })

    transmit.broadcast('channels/action', {
      message: 'A new channel has been created',
    })

    return response.send(channel)
  }

  /**
   * Subscribe to a channel
   */
  async join({ auth, request, response }: HttpContext) {
    const userPayload = auth.use('jwt').payload
    if (!userPayload?.sub) {
      return response.abort('no user connected')
    }

    const data = await request.validateUsing(joinChannelValidator)

    const channel: Channel = await this.channelService.join(userPayload.sub.toString(), data)

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
  async show({ bouncer, request, response }: HttpContext) {
    const data = await request.validateUsing(showChannelValidator)
    await bouncer.with(ChannelPolicy).authorize('show' as never)
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
