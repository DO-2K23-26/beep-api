import Channel from '#apps/channels/models/channel'
import factory from '@adonisjs/lucid/factories'
import { ServerFactory } from '#database/factories/server_factory'
import { ChannelType } from '#apps/channels/models/channel_type'

export const ChannelFactory = factory
  .define(Channel, async ({ faker }) => {
    const server = await ServerFactory.create()
    return Channel.create({
      name: faker.internet.username(),
      description: faker.lorem.sentence(),
      type: ChannelType.text_server,
      serverId: server.id,
    })
  })
  .build()

export const ChannelFactoryWithServer = (serverId: string) =>
  factory
    .define(Channel, async ({ faker }) => {
      return Channel.create({
        name: faker.internet.username(),
        description: faker.lorem.sentence(),
        type: ChannelType.text_server,
        serverId: serverId,
      })
    })
    .build()
