import Channel from '#apps/channels/models/channel'
import factory from '@adonisjs/lucid/factories'
import { ServerFactory } from '#database/factories/server_factory'
import { ChannelType } from '#apps/channels/models/channel_type'
import { UserFactory } from './user_factory.js'

export const ChannelFactory = factory
  .define(Channel, async ({ faker }) => {
    return Channel.create({
      name: faker.internet.username(),
      description: faker.lorem.sentence(),
      type: ChannelType.text_server,
    })
  })
  .state('private_channel', async (channel) => {
    channel.type = ChannelType.private_chat
  })
  .relation('users', () => UserFactory)
  .relation('server', () => ServerFactory)
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
