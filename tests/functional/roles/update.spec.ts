import { test } from '@japa/runner'
import { RoleFactory } from '#database/factories/role_factory'
import { MemberFromFactory } from '#database/factories/member_factory'
import { UserFactory } from '#database/factories/user_factory'

test.group('Roles update', () => {
  test('must return 200 when update successfully', async ({ client, assert }) => {
    const role = await RoleFactory.create()
    const user = await UserFactory.create()
    await MemberFromFactory(role.serverId, user.id).create()
    const data = { name: 'new name', permissions: 888 }
    const response = await client
      .put(`/servers/${role.serverId}/roles/${role.id}`)
      .json(data)
      .loginAs(user)
    assert.equal(response.status(), 200)
    assert.equal(response.body().name, data.name)
    assert.equal(response.body().permissions, data.permissions)
  })
})
