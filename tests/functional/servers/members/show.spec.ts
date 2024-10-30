import {
  MemberFactory,
  MemberFactoryWithServer,
  MemberFromFactory,
} from '#database/factories/member_factory'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Servers members show', () => {
  test('must return 200 if the user is on the same server', async ({ client, expect }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()

    await MemberFromFactory(server.id, user.id).make()
    const member = await MemberFactoryWithServer(server.id).make()

    const response = await client
      .get(`/v1/servers/${server.id}/members/${member.userId}`)
      .loginAs(user)

    response.assertStatus(200)

    expect(response.body()).toEqual(member.toJSON())
  }).tags(['servers:members'])

  test('must return 404 if the server does not exist', async ({ client }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()

    await MemberFromFactory(server.id, user.id).make()

    const response = await client.get(`/v1/servers/${server.id}/members/1`).loginAs(user)

    response.assertStatus(404)
  }).tags(['servers:members'])

  test('must return 401 if the user is not logged in', async ({ client }) => {
    const response = await client.get('/v1/servers/1/members/1')

    response.assertStatus(401)
  }).tags(['servers:members'])

  test('must return 403 if the user is not a member of the server', async ({ client, assert }) => {
    const user = await UserFactory.make()
    const member = await MemberFactory.make()

    const response = await client
      .get(`/v1/servers/${member.serverId}/members/${member.userId}`)
      .loginAs(user)

    response.assertStatus(403)
    assert.properties(response.body(), ['message', 'status', 'code'])
    assert.equal(response.body().status, 403)
    assert.equal(response.body().code, 'E_AUTHORIZATION_FAILURE')
  }).tags(['servers:members'])
})
