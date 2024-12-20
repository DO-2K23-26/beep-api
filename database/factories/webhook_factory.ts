import factory from '@adonisjs/lucid/factories'
import Webhook from '#apps/webhooks/models/webhook'
import jwt from 'jsonwebtoken'
import env from '#start/env'

export const WebhookFactory = factory
  .define(Webhook, async ({ faker }) => {
    return Webhook.create({
      name: faker.lorem.words(2),
      profilePicture: faker.image.avatar(),
      userId: faker.lorem.word(),
      token: '',
      channelId: faker.lorem.word(),
      serverId: faker.lorem.word(),
    })
  })
  .state(
    'token',
    (webhook) => (webhook.token = jwt.sign({ name: webhook.name }, env.get('APP_KEY')))
  )

  .build()
