import { ChannelFactory } from '#database/factories/channel_factory'
import { MemberFactory } from '#database/factories/member_factory'
import { MessageFactory } from '#database/factories/message_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Channels messages destroy', () => {
  test('must return 200 when deleting a message in channel of server', async ({ client }) => {
    const member = await MemberFactory.create()
    await member.load('user')
    const channel = await ChannelFactory.merge({ serverId: member.serverId }).create()
    const message = await MessageFactory.merge({
      channelId: channel.id,
      ownerId: member.userId,
    }).create()
    const response = await client
      .delete(`/channels/${channel.id}/messages/${message.id}`)
      .loginAs(member.user)
    response.assertStatus(200)
  }).tags(['channels:messages:destroy'])

  test('must return 200 when deleting a message if the user is a member', async ({ client }) => {
    const channel = await ChannelFactory.apply('private_channel').with('users').create()
    channel.load('users')
    const message = await MessageFactory.merge({
      channelId: channel.id,
      ownerId: channel.users[0].id,
    }).create()
    const response = await client
      .delete(`/channels/${channel.id}/messages/${message.id}`)
      .loginAs(channel.users[0])
    response.assertStatus(200)
  }).tags(['channels:messages:destroy'])

  test('must return 401 if not logged in', async ({ client }) => {
    const channel = await ChannelFactory.create()
    const message = await MessageFactory.create()
    const response = await client.delete(`/channels/${channel.id}/messages/${message.id}`)
    response.assertStatus(401)
  }).tags(['channels:messages:destroy'])

  test('must return 403 if the user is not in the server of the channel', async ({ client }) => {
    const user = await UserFactory.create()
    const channel = await ChannelFactory.with('server').create()
    const message = await MessageFactory.merge({ channelId: channel.id }).create()
    const response = await client
      .delete(`/channels/${channel.id}/messages/${message.id}`)
      .loginAs(user)
    response.assertStatus(403)
  }).tags(['channels:messages:destroy'])
  test('must return 403 if the user is not in the channel', async ({ client }) => {
    const member = await MemberFactory.create()
    await member.load('user')
    const channel = await ChannelFactory.apply('private_channel').create()
    const message = await MessageFactory.merge({ channelId: channel.id }).create()
    const response = await client
      .delete(`/channels/${channel.id}/messages/${message.id}`)
      .loginAs(member.user)
    response.assertStatus(403)
  }).tags(['channels:messages:destroy'])
  test('must return 404 if the message does not exist', async ({ client }) => {
    const member = await MemberFactory.create()
    await member.load('user')
    const channel = await ChannelFactory.merge({ serverId: member.serverId }).create()
    const response = await client
      .delete(`/channels/${channel.id}/messages/nonexistantMessageId`)
      .loginAs(member.user)
    response.assertStatus(404)
  }).tags(['channels:messages:destroy'])

  test('must return 404 if the channel does not exist', async ({ client }) => {
    const user = await UserFactory.create()
    const response = await client
      .delete(`/channels/nonexistantChannelId/messages/nonexistantMessageId`)
      .loginAs(user)
    response.assertStatus(404)
  }).tags(['channels:messages:destroy'])
})
