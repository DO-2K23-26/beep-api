import { ChannelType } from '#apps/channels/models/channel_type'
import { Permissions } from '#apps/shared/enums/permissions'
import { MemberFromFactory } from '#database/factories/member_factory'
import { RoleFactory } from '#database/factories/role_factory'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'

test.group('Channels create', () => {
  test('must return a 201 when creating a text channel with role MANAGE_CHANNEL in server', async ({
    client,
    expect,
  }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()
    const member = await MemberFromFactory(server.id, user.id).create()
    const role = await RoleFactory.merge({
      permissions: Permissions.MANAGE_CHANNELS,
      serverId: server.id,
    }).create()
    role.related('members').attach([member.id])
    const payload = {
      name: 'My Channel',
      type: ChannelType.TEXT_SERVER,
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
  test('when creating multiple channels, must return ordered positions', async ({
    client,
    expect,
  }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()
    const member = await MemberFromFactory(server.id, user.id).create()
    const role = await RoleFactory.merge({
      permissions: Permissions.MANAGE_CHANNELS,
      serverId: server.id,
    }).create()
    await role.related('members').attach([member.id])
    const payloads = [
      {
        name: 'Channel 1', //first to be created
        type: ChannelType.TEXT_SERVER,
      },
      {
        name: 'Channel 2',
        type: ChannelType.TEXT_SERVER,
      },
      {
        name: 'Channel 3', //last to be created, so needs to be the first result
        type: ChannelType.TEXT_SERVER,
      },
    ]

    const results: {
      name: string
      position: number
    }[] = []
    for (const payload of payloads) {
      const result = await client.post(`/servers/${server.id}/channels`).json(payload).loginAs(user)
      result.assertStatus(201)
      results.push(result.body())
    }

    results.sort((a, b) => a.position - b.position)
    for (let i = 0; i < payloads.length; i++) {
      expect(payloads[i].name).toEqual(results[results.length - 1 - i].name) // result should be the reverted list of insertion
    }
  })
  test('must return a 403 when user is not a member of server', async ({ client }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()
    const payload = {
      name: 'My Channel',
      type: ChannelType.TEXT_SERVER,
    }
    const result = await client.post(`/servers/${server.id}/channels`).json(payload).loginAs(user)
    result.assertStatus(403)
  }).tags(['channels:create'])
  test('must return a 422 when creating a without name', async ({ client }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()
    const payload = {
      type: ChannelType.TEXT_SERVER,
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
