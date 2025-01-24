import RoleService from '#apps/roles/services/role_service'
import { MemberFactory } from '#database/factories/member_factory'
import { RoleFactory } from '#database/factories/role_factory'
import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

const roleService = await app.container.make(RoleService)

test.group('Roles unassign', () => {
  test('must unassign role of the user', async ({ assert }) => {
    const role = await RoleFactory.create()
    const member = await MemberFactory.merge({ serverId: role.serverId }).create()
    await db.table('member_role').insert({ id: 'role_id', role_id: role.id, member_id: member.id })

    await roleService.assign(role.id, member.id)
    await roleService.unassign(role.id, member.id)
    await role.load('members')
    assert.isFalse(role.members.some((m) => m.id === member.id))
  })
})
