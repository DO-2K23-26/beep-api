import { MemberFromFactory } from '#database/factories/member_factory'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { WebhookFactory } from '#database/factories/webhook_factory'
import { test } from '@japa/runner'

test.group('Webhook update', () => {
  test('must return a 200 when update', async ({ client }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()

    await MemberFromFactory(server.id, user.id).make()

    const webhook = await WebhookFactory.make()

    const updatePayload = {
      name: 'updated string',
      webhookPicture: 'https://beep.baptistebronsin.be/logo.png',
      serverId: server.id,
      channelId: 'string',
      token: 'string',
    }

    const result = await client
      .put(`/servers/${server.id}/channels/${webhook.channelId}/webhook/${webhook.id}`)
      .json(updatePayload)
      .loginAs(user)

    result.assertStatus(200)
    result.assertBodyContains({
      name: updatePayload.name,
      webhookPicture: updatePayload.webhookPicture,
    })
  }).tags(['webhook:update'])

  test('must throw an exception when updating a nonexistent webhook', async ({ client }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()
    const channelId = 'nonexistent-channel'
    const webhookId = 'nonexistent-id'
    await MemberFromFactory(server.id, user.id).make()

    const updatePayload = {
      name: 'updated string',
      webhookPicture: 'https://beep.baptistebronsin.be/logo.png',
      serverId: server.id,
      channelId: channelId,
      token: 'string',
    }

    const result = await client
      .put(`/servers/${server.id}/channels/${channelId}/webhook/${webhookId}`)
      .json(updatePayload)
      .loginAs(user)

    result.assertStatus(404)
    result.assertBodyContains({
      code: 'E_WEBHOOK_NOT_FOUND',
    })
  }).tags(['webhook:update:exception'])
})
