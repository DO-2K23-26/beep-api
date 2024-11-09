import Channel from '#apps/channels/models/channel'
import factory from '@adonisjs/lucid/factories'
import { ServerFactory } from './server_factory.js'

export const ChannelFactory = (type: 'text' | 'voice') =>
  factory
    .define(Channel, async ({ faker }) => {
      const server = await ServerFactory.create()
      return Channel.create({
        name: faker.internet.username(),
        description: faker.lorem.sentence(),
        type: type,
        serverId: server.id,
      })
    })
    .build()

export const ChannelFactoryWithServer = (type: 'text' | 'voice', serverId: string) =>
  factory
    .define(Channel, async ({ faker }) => {
      return Channel.create({
        name: faker.internet.username(),
        description: faker.lorem.sentence(),
        type: type,
        serverId: serverId,
      })
    })
    .build()
