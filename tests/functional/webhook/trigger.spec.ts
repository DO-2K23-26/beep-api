import { MemberFromFactory } from '#database/factories/member_factory'
import { ServerFactory } from '#database/factories/server_factory'
import { UserFactory } from '#database/factories/user_factory'
import { test } from '@japa/runner'
import { WebhookFactory } from '#database/factories/webhook_factory'
test.group('Webhook trigger', () => {
  test('must return a 201 when trigger', async ({ client }) => {
    const user = await UserFactory.make()
    const server = await ServerFactory.make()
    await MemberFromFactory(server.id, user.id).make()

    const webhook = await WebhookFactory.make()

    const result = await client
      .post(`/servers/${server.id}/channels/${webhook.channelId}/webhook/${webhook.id}/trigger`)
      .loginAs(user)
    console.log(result)
    result.assertStatus(201)
  }).tags(['webhook:trigger'])
})
