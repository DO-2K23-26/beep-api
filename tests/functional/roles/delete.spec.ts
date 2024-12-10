import { test } from '@japa/runner'
import { RoleFactory } from '#database/factories/role_factory'
import { MemberFromFactory } from '#database/factories/member_factory'
import { UserFactory } from '#database/factories/user_factory'

test.group('Roles delete', () => {
  test('must return 200 when deleted successfully', async ({ client, assert }) => {
    const role = await RoleFactory.create()
    const user = await UserFactory.create()
    await MemberFromFactory(role.serverId, user.id).create()
    const response = await client.delete(`/servers/${role.serverId}/roles/${role.id}`).loginAs(user)
    assert.equal(response.status(), 200)
  })
})
