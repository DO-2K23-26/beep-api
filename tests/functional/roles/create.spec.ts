import { Permissions } from '#apps/shared/enums/permissions'
import { ServerFactory } from '#database/factories/server_factory'
import { test } from '@japa/runner'

test.group('Roles create', () => {
  test('example test', async ({ client }) => {
    const server = await ServerFactory.with('members').create()
    await server.load('members')

    const member = server.members[0]
    await member.load('user')
    const payload = {
      name: 'Admin',
      permissions: Permissions.MANAGE_MESSAGES,
    }
    const result = await client
      .post(`/servers/${server.id}/roles`)
      .json(payload)
      .loginAs(member.user)
    result.assertStatus(201)
    result.assertBodyContains({
      name: payload.name,
      permissions: payload.permissions,
      serverId: server.id,
    })
  })
})
