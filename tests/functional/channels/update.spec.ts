import { ChannelFactory } from '#database/factories/channel_factory'
import { MemberFromFactory } from '#database/factories/member_factory'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Channels update', () => {
  test('must return 200 when update successfully', async ({ assert, client }) => {
    const channel = await ChannelFactory.with('server').create()
    const user = await UserFactory.create()
    await MemberFromFactory(channel.serverId, user.id).create()
    const data = { name: 'new name', description: 'new description' }
    const response = await client
      .put(`/servers/${channel.serverId}/channels/${channel.id}`)
      .json(data)
      .loginAs(user)
    assert.equal(response.status(), 200)
    assert.equal(response.body().name, data.name)
    assert.equal(response.body().description, data.description)
  }).tags(['channels:update'])
  test('must return 200 when update description successfully', async ({ assert, client }) => {
    const channel = await ChannelFactory.with('server').create()
    const user = await UserFactory.create()
    await MemberFromFactory(channel.serverId, user.id).create()
    const data = { description: 'new description' }
    const response = await client
      .put(`/servers/${channel.serverId}/channels/${channel.id}`)
      .json(data)
      .loginAs(user)
    assert.equal(response.status(), 200)
    assert.equal(response.body().name, channel.name)
    assert.equal(response.body().description, data.description)
  }).tags(['channels:update'])
  test('must return 200 when update position successfully', async ({ assert, client }) => {
    const channel = await ChannelFactory.with('server').create()
    const user = await UserFactory.create()
    await MemberFromFactory(channel.serverId, user.id).create()
    const data = { position: 1 }
    const response = await client
      .put(`/servers/${channel.serverId}/channels/${channel.id}`)
      .json(data)
      .loginAs(user)
    assert.equal(response.status(), 200)
    assert.equal(response.body().position, data.position)
    assert.equal(response.body().name, channel.name)
  }).tags(['channels:update'])
  test('must return 200 when update name successfully', async ({ assert, client }) => {
    const channel = await ChannelFactory.with('server').create()
    const user = await UserFactory.create()
    await MemberFromFactory(channel.serverId, user.id).create()
    const data = { name: 'new name' }
    const response = await client
      .put(`/servers/${channel.serverId}/channels/${channel.id}`)
      .json(data)
      .loginAs(user)
    assert.equal(response.status(), 200)
    assert.equal(response.body().name, data.name)
    assert.equal(response.body().description, channel.description)
  }).tags(['channels:update'])
  test('must return 401 when not logged in', async ({ assert, client }) => {
    const channel = await ChannelFactory.with('server').create()
    const data = { name: 'new name' }
    const response = await client
      .put(`/servers/${channel.serverId}/channels/${channel.id}`)
      .json(data)
    assert.equal(response.status(), 401)
  })
  test('must return 403 when user is not a member of server', async ({ assert, client }) => {
    const channel = await ChannelFactory.with('server').create()
    const user = await UserFactory.create()
    const data = { name: 'new name', description: 'new description' }
    const response = await client
      .put(`/servers/${channel.serverId}/channels/${channel.id}`)
      .json(data)
      .loginAs(user)
    assert.equal(response.status(), 403)
  })

  test('must return 404 if the channel does not exist', async ({ assert, client }) => {
    const server = await ServerFactory.create()
    const user = await UserFactory.create()
    await MemberFromFactory(server.id, user.id).create()
    const data = { name: 'new name' }
    const response = await client
      .put(`/servers/${server.id}/channels/nonexistantId`)
      .json(data)
      .loginAs(user)
    assert.equal(response.status(), 404)
  }).tags(['channels:update'])
})
