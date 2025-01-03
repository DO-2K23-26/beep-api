import RoleNotFoundException from '#apps/roles/exceptions/role_not_found_exception'
import Role from '#apps/roles/models/role'
import { CreateRoleSchema, UpdateRoleSchema } from '#apps/roles/validators/role'
import ServerNotFoundException from '#apps/servers/exceptions/server_not_found_exception'
import Server from '#apps/servers/models/server'
import { inject } from '@adonisjs/core'

@inject()
export default class RoleService {
  async findById(roleId: string): Promise<Role> {
    const role = await Role.query()
      .where('id', roleId)
      .firstOrFail()
      .catch(() => {
        throw new RoleNotFoundException('Server not found', { status: 404, code: 'E_ROWNOTFOUND' })
      })
    return role
  }

  async findAllByServer(serverId: string): Promise<Role[]> {
    const server = await Server.findOrFail(serverId).catch(() => {
      throw new ServerNotFoundException('Server not found', { status: 404, code: 'E_ROWNOTFOUND' })
    })
    await server.load('roles')
    return server.roles
  }

  async create(newRole: CreateRoleSchema, serverId: string): Promise<Role> {
    const permissions = newRole.permissions
    const role = await Role.create({
      name: newRole.name,
      permissions: permissions,
      serverId: serverId,
    })
    return role.save()
  }

  async update(id: string, payload: UpdateRoleSchema): Promise<Role> {
    const role = await Role.findOrFail(id).catch(() => {
      throw new RoleNotFoundException('Role not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })
    role.merge(payload)
    return role.save()
  }

  async deleteById(roleId: string): Promise<void> {
    const role: Role = await Role.findOrFail(roleId).catch(() => {
      throw new RoleNotFoundException('Role not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })
    await role.delete()
  }
}
