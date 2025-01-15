import Role from '#apps/roles/models/role'
import { CreateRoleSchema, UpdateRoleSchema } from '#apps/roles/validators/role'
import Server from '#apps/servers/models/server'
import { inject } from '@adonisjs/core'

@inject()
export default class RoleService {
  async findById(roleId: string): Promise<Role> {
    return Role.findOrFail(roleId)
  }

  async findAllByServer(serverId: string): Promise<Role[]> {
    const server = await Server.findOrFail(serverId)
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
    const role = await Role.findOrFail(id)
    role.merge(payload)
    return role.save()
  }

  async deleteById(roleId: string): Promise<void> {
    const role: Role = await Role.findOrFail(roleId)
    await role.delete()
  }
}
