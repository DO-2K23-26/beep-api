import { MemberFromFactory } from '#database/factories/member_factory'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Channels create', () => {
  test('must return a 201 when creating a text channel', async ({ client, expect }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()
    await MemberFromFactory(server.id, user.id).create()
    const payload = {
      name: 'My Channel',
      type: 'text',
    }
    const result = await client.post(`/servers/${server.id}/channels`).json(payload).loginAs(user)
    result.assertStatus(201)
    expect(result.body()).toEqual(
      expect.objectContaining({
        name: payload.name,
        type: payload.type,
        serverId: server.id,
      })
    )
  }).tags(['channels:create'])
  test('must return a 403 when user is not a member of server', async ({ client }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()
    const payload = {
      name: 'My Channel',
      type: 'text',
    }
    const result = await client.post(`/servers/${server.id}/channels`).json(payload).loginAs(user)
    result.assertStatus(403)
  }).tags(['channels:create'])
  test('must return a 422 when creating a without name', async ({ client }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()
    const payload = {
      type: 'text',
    }
    const result = await client.post(`/servers/${server.id}/channels`).json(payload).loginAs(user)
    result.assertStatus(422)
  }).tags(['channels:create'])
  test('must return a 422 when creating a without type', async ({ client }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()
    const payload = {
      name: 'My Channel',
    }
    const result = await client.post(`/servers/${server.id}/channels`).json(payload).loginAs(user)
    result.assertStatus(422)
  }).tags(['channels:create'])
})
