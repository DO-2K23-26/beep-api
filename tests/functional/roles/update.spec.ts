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
    response.assertStatus(200)
    assert.equal(response.body().name, data.name)
    assert.equal(response.body().permissions, data.permissions)
  }).tags(['roles:update'])

  test('must return 401 if your are not login', async ({ client }) => {
    const role = await RoleFactory.create()
    const data = { name: 'new name', permissions: 888 }
    const response = await client.put(`/servers/${role.serverId}/roles/${role.id}`).json(data)
    response.assertStatus(401)
  }).tags(['roles:update'])

  test('must return 403 when user is not a member of the server', async ({ client }) => {
    const user = await UserFactory.make()
    const role = await RoleFactory.create()
    const data = { name: 'new name', permissions: 888 }

    const result = await client
      .put(`/servers/${role.serverId}/roles/${role.id}`)
      .json(data)
      .loginAs(user)
    result.assertStatus(403)
  }).tags(['roles:update'])

  test('must return 404 if the server does not exist', async ({ client }) => {
    const role = await RoleFactory.create()
    const user = await UserFactory.create()
    await MemberFromFactory(role.serverId, user.id).create()
    const data = { name: 'new name', permissions: 888 }

    const response = await client
      .put(`/servers/nonexistantServerId/roles/${role.id}`)
      .json(data)
      .loginAs(user)

    response.assertStatus(404)
  }).tags(['roles:update'])

  test('must return 404 if the role does not exist', async ({ client }) => {
    const role = await RoleFactory.create()
    const user = await UserFactory.create()
    await MemberFromFactory(role.serverId, user.id).create()
    const data = { name: 'new name', permissions: 888 }

    const response = await client
      .put(`/servers/${role.serverId}/roles/nonexistantRoleId`)
      .json(data)
      .loginAs(user)

    response.assertStatus(404)
  }).tags(['roles:update'])
})
