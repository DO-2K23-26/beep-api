import { Permissions } from '#apps/shared/enums/permissions'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Roles create', () => {
  test('must return a 201 when creating a role with 1 permission', async ({ client }) => {
    const server = await ServerFactory.with('members').create()
    await server.load('members')

    const member = server.members[0]
    await member.load('user')
    const payload = {
      name: 'My role',
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
  }).tags(['roles:create'])

  test('must return a 201 when creating a role with some permissions', async ({ client }) => {
    const server = await ServerFactory.with('members').create()
    await server.load('members')

    const member = server.members[0]
    await member.load('user')
    const payload = {
      name: 'My role',
      permissions:
        Permissions.MANAGE_MESSAGES + Permissions.SEND_MESSAGES + Permissions.ATTACH_FILES,
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
  }).tags(['roles:create'])

  test('must return 401 if your are not login', async ({ client }) => {
    const server = await ServerFactory.create()

    const payload = {
      name: 'My role',
      permissions: Permissions.MANAGE_MESSAGES,
    }
    const response = await client.post(`/servers/${server.id}/roles`).json(payload)
    response.assertStatus(401)
  }).tags(['roles:create'])

  test('must return 403 when user is not a member of the server', async ({ client }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.create()

    const payload = {
      name: 'My role',
      permissions: Permissions.MANAGE_MESSAGES,
    }
    const result = await client.post(`/servers/${server.id}/roles`).json(payload).loginAs(user)
    result.assertStatus(403)
  }).tags(['roles:create'])

  test('must return 422 when creating a role without name', async ({ client }) => {
    const server = await ServerFactory.with('members').create()
    await server.load('members')

    const member = server.members[0]
    await member.load('user')

    const payload = {
      permissions: Permissions.MANAGE_MESSAGES,
    }
    const result = await client
      .post(`/servers/${server.id}/roles`)
      .json(payload)
      .loginAs(member.user)
    result.assertStatus(422)
  }).tags(['roles:create'])

  test('must return 422 when creating a role without permissions', async ({ client }) => {
    const server = await ServerFactory.with('members').create()
    await server.load('members')

    const member = server.members[0]
    await member.load('user')

    const payload = {
      name: 'My role',
    }
    const result = await client
      .post(`/servers/${server.id}/roles`)
      .json(payload)
      .loginAs(member.user)
    result.assertStatus(422)
  }).tags(['roles:create'])
})
