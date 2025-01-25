import { MemberFactory } from '#database/factories/member_factory'
import { RoleFactory } from '#database/factories/role_factory'
import { test } from '@japa/runner'

test.group('Roles members unassign', () => {
  test('must return 200 and unassign role', async ({ client }) => {
    const member = await MemberFactory.create()
    await member.load('user')
    const role = await RoleFactory.merge({ serverId: member.serverId }).create()
    role.related('members').attach([member.id])
    const response = await client
      .delete(`v1/servers/${member.serverId}/members/${member.id}/roles/${role.id}`)
      .loginAs(member.user)
    response.assertStatus(200)
  })
  test('must return 401 if the user is not authenticated', async ({ client }) => {
    const member = await MemberFactory.create()
    await member.load('user')
    const role = await RoleFactory.merge({ serverId: member.serverId }).create()
    role.related('members').attach([member.id])
    const response = await client.delete(
      `v1/servers/${member.serverId}/members/${member.id}/roles/${role.id}`
    )
    response.assertStatus(401)
  })
})
