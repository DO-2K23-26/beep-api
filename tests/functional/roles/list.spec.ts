import { RoleFactory } from '#database/factories/role_factory'
import { MemberFromFactory } from '#database/factories/member_factory'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Roles list', () => {
  test('must return 200 and roles of the user if the user is a member', async ({ client, assert }) => {
    const server = await ServerFactory.with('members').create()
    await server.load('members')

    const member = server.members[0]
    await member.load('user')

    const role = await RoleFactory.create()
    const user = await UserFactory.create()
    const member = await MemberFromFactory(channel.serverId, user.id).create()

    const response = await client.get(`/servers/${member.serverId}/channels`).loginAs(user)

    response.assertStatus(200)
    // gepetto assert body
  })
})
