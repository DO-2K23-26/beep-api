import Channel from '#apps/channels/models/channel'
import factory from '@adonisjs/lucid/factories'
import { ServerFactory } from './server_factory.js'

export const ChannelFactory = factory
  .define(Channel, async ({ faker }) => {
    const server = await ServerFactory.make()
    return Channel.create({
      name: faker.internet.username(),
      description: faker.lorem.sentence(),
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
        serverId: serverId,
      })
    })
    .build()
