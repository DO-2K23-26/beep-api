import { ChannelFactory } from '#database/factories/channel_factory'
import { MemberFromFactory } from '#database/factories/member_factory'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Channels list', () => {
  test('must return 200 and channels of the user if the user is a member', async ({
    client,
    expect,
  }) => {
    const channel = await ChannelFactory('text').create()
    const user = await UserFactory.create()
    const member = await MemberFromFactory(channel.serverId, user.id).create()

    const response = await client.get(`/servers/${member.serverId}/channels`).loginAs(user)

    response.assertStatus(200)
    expect(response.body()).toHaveLength(1)
    expect(response.body()[0]).toEqual(expect.objectContaining(channel.toJSON()))
  })
  test('must return 401 if your are not login', async ({ client }) => {
    const server = await ServerFactory.create()
    const response = await client.get(`/servers/${server.id}/channels`)
    response.assertStatus(401)
  })
  test('must return 403 when the user is not a member of the server', async ({ client }) => {
    const server = await ServerFactory.create()
    await ChannelFactory('text').create()
    const user = await UserFactory.create()

    const response = await client.get(`/servers/${server.id}/channels`).loginAs(user)

    response.assertStatus(403)
  })
  test('must return 404 if the server does not exist', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.get(`/servers/nonexistantServerId/channels`).loginAs(user)

    response.assertStatus(404)
  })
})
