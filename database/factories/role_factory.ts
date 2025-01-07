import Role from '#apps/roles/models/role'
import factory from '@adonisjs/lucid/factories'
import { ServerFactory } from '#database/factories/server_factory'
import { DEFAULT_ROLE_SERVER_PERMISSION } from '#apps/shared/constants/default_role_permission'
import { DEFAULT_ROLE_SERVER } from '#apps/shared/constants/default_role_server'

export const RoleFactory = factory
  .define(Role, async ({ faker }) => {
    const server = await ServerFactory.create()
    return Role.create({
      name: faker.internet.username(),
      permissions: faker.number.int({ max: 0xfff }),
      serverId: server.id,
    })
  })
  .state('default_role', async (role) => {
    role.id = role.serverId
    role.permissions = DEFAULT_ROLE_SERVER_PERMISSION
    role.name = DEFAULT_ROLE_SERVER
  })
  .build()

export const RoleWithServerFactory = (serverId: string) =>
  factory
    .define(Role, async ({ faker }) => {
      return Role.create({
        id: serverId,
        name: faker.internet.username(),
        permissions: faker.number.int({ max: 0xfff }),
        serverId: serverId,
      })
    })
    .state('default_role', async (role) => {
      role.permissions = DEFAULT_ROLE_SERVER_PERMISSION
      role.name = DEFAULT_ROLE_SERVER
    })
    .build()
