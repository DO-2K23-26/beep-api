import { MemberFactory } from '#database/factories/member_factory'
import { RoleFactory } from '#database/factories/role_factory'
import { test } from '@japa/runner'

test.group('Roles members assign', () => {
  test('must return 200 and assign role to member', async ({ client }) => {
    const member = await MemberFactory.create()
    await member.load('user')
    const role = await RoleFactory.merge({ serverId: member.serverId }).create()
    const response = await client
      .post(`/v1/servers/${role.serverId}/members/${member.id}/roles/${role.id}`)
      .loginAs(member.user)

    response.assertStatus(201)
  })
  test('must return 401 if the user is not authenticated', async ({ client }) => {
    const member = await MemberFactory.create()
    await member.load('user')
    const role = await RoleFactory.merge({ serverId: member.serverId }).create()
    const response = await client.post(
      `/v1/servers/${role.serverId}/members/${member.id}/roles/${role.id}`
    )
    response.assertStatus(401)
  })
})
