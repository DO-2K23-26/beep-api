import User from '#apps/users/models/user'
import { test } from '@japa/runner'

test.group('Users servers list', () => {
  test('must return the user\'s list of servers', async ({ assert, client }) => {
    const user = await User.findByOrFail('username', 'nathael')

    const response = await client.get('/v1/users/@me/servers').loginAs(user)
    response.assertStatus(200)

    assert.isArray(response.body())
    assert.lengthOf(response.body(), 1)
    assert.equal(response.body()[0].name, 'Test[01]')
  }).tags(['users:servers', 'users'])

  test('must return 200 if the user is logged in', async ({ assert, client }) => {
    const user = await User.firstOrFail()

    const response = await client.get('/v1/users/@me/servers').loginAs(user)
    response.assertStatus(200)
    assert.isArray(response.body())
  }).tags(['users:servers', 'users'])

  test('must return 401 if the user is not logged in', async ({ assert, client }) => {
    const response = await client.get('/v1/users/@me/servers')
    response.assertStatus(401)

    assert.properties(response.body(), ['message', 'code', 'status'])
    assert.equal(response.body().status, 401)
    assert.equal(response.body().code, 'E_UNAUTHORIZED_ACCESS')
  }).tags(['users:servers', 'users'])
})
