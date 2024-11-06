// import { ServerFactory } from '#database/factories/server_factory'
// import { UserFactory } from '#database/factories/user_factory'
// import { test } from '@japa/runner'

// test.group('Channels create', () => {
//   test('must return a 201 when creating', async ({ client }) => {
//     const user = await UserFactory.make()
//     const server = await ServerFactory.make()
//     const payload = {
//       name: 'My Channel',
//       serverId: server.id,
//     }
//     const result = await client.post(`/servers/${server.id}/channels`).json(payload).loginAs(user)
//     result.assertStatus(201)
//   })
// })
