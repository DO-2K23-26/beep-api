import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import ChannelService from '#apps/channels/services/channel_service'
import Channel from '../models/channel.js'
import {createChannelValidator, showChannelValidator, updateChannelValidator} from '../validators/channel.js'

@inject()
export default class ChannelsController {
  constructor(private channelService: ChannelService) {}

  /**
   * Display a list of resource
   */
  async index({ response }: HttpContext) {
    const channels = await this.channelService.findAll()

    return response.send(channels)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createChannelValidator)

    const channel: Channel = await this.channelService.create(payload)

    return response.send(channel)
  }

  /**
   * Show individual record
   */
  async show({ request, response }: HttpContext) {
    const data = await request.validateUsing(showChannelValidator)
    console.log(request)

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

    return response.send('channel has been deleted')
  }
}
