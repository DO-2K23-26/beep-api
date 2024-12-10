import factory from '@adonisjs/lucid/factories'
import Webhook from '#apps/webhooks/models/webhook'

export const WebhookFactory = factory
  .define(Webhook, async ({ faker }) => {
    return Webhook.create({
      name: faker.lorem.words(2),
      profilePicture: faker.image.avatar(),
      token: faker.lorem.word(),
      userId: faker.lorem.word(),
      channelId: faker.lorem.word(),
      serverId: faker.lorem.word(),
    })
  })
  .build()
