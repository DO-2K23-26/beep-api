import { Permissions } from '#apps/shared/enums/permissions'
import { MemberFactory } from '#database/factories/member_factory'
import { RoleFactory } from '#database/factories/role_factory'
import { test } from '@japa/runner'

test.group('Servers members update', () => {
  test('should return 200 when updated and the member with permission MANAGE_NICKNAMES', async ({
    client,
  }) => {
    const member = await MemberFactory.create()
    const role = await RoleFactory.merge({
      permissions: Permissions.MANAGE_NICKNAMES,
      serverId: member.serverId,
    }).create()
    await role.related('members').attach([member.id])
    await member.load('user')
    const data = { nickname: 'newNickname' }
    const response = await client
      .put(`v1/servers/${member.serverId}/members/${member.id}`)
      .json(data)
      .loginAs(member.user)
    response.assertStatus(200)
    response.assertBodyContains({ nickname: 'newNickname' })
  })
})
