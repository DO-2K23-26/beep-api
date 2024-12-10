import Role from '#apps/roles/models/role'
import factory from '@adonisjs/lucid/factories'
import { ServerFactory } from '#database/factories/server_factory'

export const RoleFactory = factory
  .define(Role, async ({ faker }) => {
    const server = await ServerFactory.create()
    return Role.create({
      name: faker.internet.username(),
      permissions: faker.number.int({ max: 0xfff }),
      serverId: server.id,
    })
  })
  .build()
