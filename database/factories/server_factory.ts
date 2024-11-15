import factory from '@adonisjs/lucid/factories'
import Server from '#apps/servers/models/server'

export const ServerFactory = factory
  .define(Server, async ({ faker }) => {
    return Server.create({
      name: faker.internet.displayName(),
      description: faker.lorem.sentence(),
    })
  })
  .build()

export const ServerFactoryWithOwner = (ownerId: string) =>
  factory
    .define(Server, async ({ faker }) => {
      return Server.create({
        name: faker.internet.displayName(),
        description: faker.lorem.sentence(),
        ownerId,
      })
    })
    .build()
