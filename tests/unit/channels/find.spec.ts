import ChannelService from '#apps/channels/services/channel_service'
import { ChannelFactory } from '#database/factories/channel_factory'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import redis from '@adonisjs/redis/services/main'

const channelService = await app.container.make(ChannelService)

test.group('Channels find', () => {
  test('must return a channel with the given id', async ({ expect }) => {
    const channelCreated = await ChannelFactory.create()
    const channel = await channelService.findByIdOrFail(channelCreated.id)
    expect(channel.id).toBe(channelCreated.id)
    expect(channel.name).toBe(channelCreated.name)
  })
  test('must cache the found channel', async ({ expect }) => {
    const channelCreated = await ChannelFactory.create()
    await channelService.findByIdOrFail(channelCreated.id)
    const channelJson = await redis.get(`channel:${channelCreated.id}`)
    const cachedChannel = JSON.parse(channelJson!)
    expect(cachedChannel).not.toBeNull()
    expect(cachedChannel.id).toBe(channelCreated.id)
    expect(cachedChannel.name).toBe(channelCreated.name)
  })
})
