import ChannelService from '#apps/channels/services/channel_service'
import { ChannelFactory } from '#database/factories/channel_factory'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

const channelService = await app.container.make(ChannelService)

test.group('Channels find', () => {
  test('must return a channel with the given id', async ({ expect }) => {
    const channelCreated = await ChannelFactory.create()
    const channel = await channelService.findByIdOrFail(channelCreated.id)
    expect(channel.id).toBe(channelCreated.id)
    expect(channel.name).toBe(channelCreated.name)
    expect(channel.position).toBe(0)
  })
})
