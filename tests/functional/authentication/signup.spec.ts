import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Authentication signup', () => {
  test('Must return 201 when signing up for the first time', async ({ client, expect }) => {
    const payload = {
      username: 'Testusername',
      firstname: 'Testfirstname',
      lastname: 'lastname',
      email: 'testuser@example.com',
      password: 'password123',
    }
    const result = await client.post('/authentication/signup').json(payload)

    result.assertStatus(201)
    expect(result.body())
    expect(result.body()).toEqual(
      expect.objectContaining({
        username: payload.username,
        firstName: payload.firstname,
        lastName: payload.lastname,
        email: payload.email,
      })
    )
  }).tags(['authentication:signup'])

  test('Must return 403 when signing up with a user that already exist', async ({ client }) => {
    const user = await UserFactory.make()
    const payload = {
      username: user.username,
      firstname: user.firstName,
      lastname: user.lastName,
      email: user.email,
      password: 'password123',
    }
    const result = await client.post('/authentication/signup').json(payload)

    result.assertStatus(403)
  }).tags(['authentication:signup'])
})
