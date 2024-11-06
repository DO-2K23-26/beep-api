import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Servers create', () => {
  test('must return a 201 when create', async ({ client, expect }) => {
    const payload = {
      name: 'My Server 123',
      visibility: 'public',
      description: 'This is a test server',
    }
    const user = await UserFactory.make()
    const result = await client.post('/servers').json(payload).loginAs(user)
    result.assertStatus(201)
    expect(result.body()).toEqual(
      expect.objectContaining({
        name: payload.name,
        description: payload.description,
      })
    )
  })
  test('must add the use creating the server as member', async ({ client, expect }) => {
    const payload = {
      name: 'My Server 2',
      visibility: 'public',
      icon: null,
      description: 'This is a test server',
    }
    const user = await UserFactory.make()
    const resultServerCreation = await client.post('/servers').json(payload).loginAs(user)
    const resultMember = await client
      .get(`/v1/servers/${resultServerCreation.body().id}/members`)
      .loginAs(user)
    resultMember.assertStatus(200)
    expect(resultMember.body().data[0]).toEqual(
      expect.objectContaining({
        nickname: user.username,
        serverId: resultServerCreation.body().id,
        userId: user.id,
      })
    )
  })
  test('must return a 201 when creating a server without description', async ({ client }) => {
    const user = await UserFactory.make()
    const payload = {
      name: 'My Server 3',
      visibility: 'public',
      icon: null,
    }
    const result = await client.post('/servers').json(payload).loginAs(user)
    result.assertStatus(201)
  })
  test('must return a 422 when creating a server without name', async ({ client }) => {
    const user = await UserFactory.make()
    const payload = {
      desciption: 'This is a test server 4',
      visibility: 'public',
      icon: null,
    }
    const result = await client.post('/servers').json(payload).loginAs(user)
    result.assertStatus(422)
  })
})
