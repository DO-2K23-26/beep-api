import factory from '@adonisjs/lucid/factories'
import Server from '#apps/servers/models/server'

export const ServerFactory = factory
  .define(Server, async ({ faker }) => {
    return Server.create({
      name: faker.airline.airline().name
    })
  })
  .build()
