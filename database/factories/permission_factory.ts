import Permission from '#apps/permissions/models/permission'
import factory from '@adonisjs/lucid/factories'
import { ServerFactory } from '#database/factories/server_factory'

export const PermissionFactory = factory
  .define(Permission, async ({ faker }) => {
    const server = await ServerFactory.create()
    return Permission.create({
      name: faker.internet.username(),
      permissions: faker.random.number(),
      serverId: server.id,
    })
  })
  .state('private_permission', async (permission) => {
    permission.type = PermissionType.private_chat
  })
  .build()
