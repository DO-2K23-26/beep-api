import { InvitationStatus } from '#apps/invitations/models/status'
import { InvitationType } from '#apps/invitations/models/type'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Invitations server create ', () => {
  test('must return 201 when creating unique', async ({ client, expect, assert }) => {
    const server = await ServerFactory.merge({ visibility: 'private' }).with('members').create()
    await server.load('members', async (query) => {
      await query.preload('user')
    })
    const response = await client
      .post(`/v1/servers/${server.id}/invitation`)
      .json({
        expiration: '2030-01-01T00:00:00.000Z',
        isUnique: true,
      })
      .loginAs(server.members[0].user)
    response.assertStatus(201)
    expect(response.body()).toHaveProperty('expiration')
    assert.containsSubset(response.body(), {
      creatorId: server.members[0].user.id,
      serverId: server.id,
      type: InvitationType.SERVER,
      status: InvitationStatus.Pending,
    })
  }).tags(['invitations:create'])
  test('must return 201 when creating not unique', async ({ client, expect, assert }) => {
    const server = await ServerFactory.merge({ visibility: 'private' }).with('members').create()
    await server.load('members', async (query) => {
      await query.preload('user')
    })
    const response = await client
      .post(`/v1/servers/${server.id}/invitation`)
      .json({
        expiration: '2030-01-01T00:00:00.000Z',
        isUnique: false,
      })
      .loginAs(server.members[0].user)
    response.assertStatus(201)
    expect(response.body()).toHaveProperty('expiration')
    assert.containsSubset(response.body(), {
      creatorId: server.members[0].user.id,
      serverId: server.id,
      type: InvitationType.SERVER,
    })
  }).tags(['invitations:create'])
  test('must return 400 when creating invitation for a public server', async ({ client }) => {
    const server = await ServerFactory.merge({ visibility: 'public' }).with('members').create()
    await server.load('members', async (query) => {
      await query.preload('user')
    })
    const response = await client
      .post(`/v1/servers/${server.id}/invitation`)
      .json({
        expiration: '2030-01-01T00:00:00.000Z',
        isUnique: true,
      })
      .loginAs(server.members[0].user)
    response.assertStatus(400)
  }).tags(['invitations:create'])

  test('must return 404 when server does not exist', async ({ client }) => {
    const user1 = await UserFactory.create()
    const response = await client
      .post(`/v1/servers/non-existent-server-id/invitation`)
      .json({
        expiration: '2030-01-01T00:00:00.000Z',
        isUnique: true,
      })
      .loginAs(user1)
    response.assertStatus(404)
  }).tags(['invitations:create'])
  test('must return 401 when the user is not logged in', async ({ client }) => {
    const server = await ServerFactory.merge({ visibility: 'private' }).create()
    const response = await client.post(`/v1/servers/${server.id}/invitation`).json({
      expiration: '2030-01-01T00:00:00.000Z',
      isUnique: true,
    })
    response.assertStatus(401)
  }).tags(['invitations:create'])

  test('must return 422 when expiration date is missing', async ({ client }) => {
    const user1 = await UserFactory.create()
    const server = await ServerFactory.merge({ visibility: 'private' }).create()
    const response = await client
      .post(`/v1/servers/${server.id}/invitation`)
      .json({
        isUnique: true,
      })
      .loginAs(user1)
    response.assertStatus(422)
  }).tags(['invitations:create'])
  test('must return 422 when isUnique is missing', async ({ client }) => {
    const user1 = await UserFactory.create()
    const server = await ServerFactory.merge({ visibility: 'private' }).create()
    const response = await client
      .post(`/v1/servers/${server.id}/invitation`)
      .json({
        expiration: '2030-01-01T00:00:00.000Z',
      })
      .loginAs(user1)
    response.assertStatus(422)
  }).tags(['invitations:create'])
  test('must return 422 when both expiration and isUnique are missing', async ({ client }) => {
    const user1 = await UserFactory.create()
    const server = await ServerFactory.merge({ visibility: 'private' }).create()
    const response = await client
      .post(`/v1/servers/${server.id}/invitation`)
      .json({})
      .loginAs(user1)
    response.assertStatus(422)
  }).tags(['invitations:create'])
})
