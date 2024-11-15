import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import { FriendFactory } from '#database/factories/friend_factory'

test.group('Friends', () => {
  test('must return a 200 when listing friends', async ({ client }) => {
    const user = await UserFactory.make()
    await FriendFactory(user.id).create()
    const response = await client.get('/users/@me/friends').loginAs(user).send()
    response.assertStatus(200)
    response.assertBodyContains([{ userId: user.id }])
  }).tags(['friends:index'])

  test('must return a 401 when listing friends for a user that does not exist', async ({
    client,
  }) => {
    const user1 = await UserFactory.make()
    await FriendFactory(user1.id).create()
    const response = await client.get('/users/@me/friends').send()
    response.assertStatus(401)
  }).tags(['friends:index'])

  test('must return a 200 when deleting a friend', async ({ client }) => {
    const user1 = await UserFactory.make()
    const friendship = await FriendFactory(user1.id).create()
    const response = await client.delete(`/friends/${friendship.friend_id}`).loginAs(user1).send()
    response.assertStatus(200)
    response.assertBodyContains({ message: 'Friend deleted successfully' })
  }).tags(['friends:delete'])

  test('must return a 404 when deleting a non-existent friend', async ({ client }) => {
    const user1 = await UserFactory.make()
    const response = await client.delete(`/friends/1`).loginAs(user1).send()
    response.assertStatus(404)
  }).tags(['friends:delete'])

  test('must return a 201 when creating a friend', async ({ client }) => {
    const user1 = await UserFactory.make()
    const user2 = await UserFactory.make()
    const response = await client.post(`/friends/${user2.id}`).loginAs(user1).send()
    response.assertStatus(201)
    response.assertBodyContains({ userId: user1.id, friendId: user2.id })
  }).tags(['friends:create'])

  test('must return a 404 when creating a friend with a non-existent user', async ({ client }) => {
    const user1 = await UserFactory.create()
    const response = await client.post(`/friends/1`).loginAs(user1).send()
    response.assertStatus(404)
  }).tags(['friends:create'])

  test('must return a 401 when creating a friend for a user that does not exist', async ({
    client,
  }) => {
    const user = await UserFactory.make()
    const response = await client.post(`/friends/${user.id}`).send()
    response.assertStatus(401)
  }).tags(['friends:create'])
})
