import Role from '#apps/roles/models/role'
import factory from '@adonisjs/lucid/factories'
import { ServerFactory } from '#database/factories/server_factory'
import { RoleType } from '#apps/roles/models/role_type'

export const RoleFactory = factory
  .define(Role, async ({ faker }) => {
    const server = await ServerFactory.create()
    return Role.create({
      name: faker.internet.username(),
      permissions: faker.random.number(),
      serverId: server.id,
    })
  })
  .state('private_role', async (role) => {
    role.type = RoleType.private_chat
  })
  .build()

export const RoleFactoryWithServer = (serverId: string) =>
  factory
    .define(Role, async ({ faker }) => {
      return Role.create({
        name: faker.internet.username(),
        description: faker.lorem.sentence(),
        type: RoleType.text_server,
        serverId: serverId,
      })
    })
    .build()
