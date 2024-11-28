import factory from '@adonisjs/lucid/factories'
import Server from '#apps/servers/models/server'
import { UserFactory } from '#database/factories/user_factory'
import { MemberFactory } from '#database/factories/member_factory'

export const ServerFactory = factory
  .define(Server, async ({ faker }) => {
    const user = await UserFactory.create()
    return Server.create({
      name: faker.internet.displayName(),
      description: faker.lorem.sentence(),
      ownerId: user.id,
    })
  })
  .relation('members', () => MemberFactory)
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
