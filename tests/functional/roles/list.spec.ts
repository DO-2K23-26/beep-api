import { RoleFactory } from '#database/factories/role_factory'
import { MemberFromFactory } from '#database/factories/member_factory'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Roles list', () => {
  test('must return 200 and roles of the user if the user is a member', async ({ client }) => {
    const role = await RoleFactory.create()
    const server = await ServerFactory.with('members').create()
    const user = await UserFactory.create()
    const member = await MemberFromFactory(role.serverId, user.id).create()
    await server.load('members')

    const response = await client.get(`/servers/${member.serverId}/roles`).loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains([{ id: role.id }])
  })
  test('must return 200 and the given role of the user if the user is a member', async ({
    client,
  }) => {
    const role = await RoleFactory.create()
    const server = await ServerFactory.with('members').create()
    const user = await UserFactory.create()
    const member = await MemberFromFactory(role.serverId, user.id).create()
    await server.load('members')

    const response = await client.get(`/servers/${member.serverId}/roles/${role.id}`).loginAs(user)

    response.assertStatus(200)
    response.assertBodyContains({ id: role.id })
  })
})
