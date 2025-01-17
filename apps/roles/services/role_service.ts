import InvalidPermissionsMaskException from '#apps/roles/exceptions/invalid_permissions_mask_exception'
import Role from '#apps/roles/models/role'
import { CreateRoleSchema, UpdateRoleSchema } from '#apps/roles/validators/role'
import PermissionsService from '#apps/shared/services/permissions/permissions_service'
import Server from '#apps/servers/models/server'
import { inject } from '@adonisjs/core'
import { BasePolicy } from '@adonisjs/bouncer'

@inject()
export default class RoleService extends BasePolicy {
  constructor(protected permissionsService: PermissionsService) {
    super()
  }

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
    // Check for permissions validity
    if (!this.permissionsService.isValidMask(permissions)) {
      throw new InvalidPermissionsMaskException('Invalid permissions mask', {
        status: 400,
        code: 'E_INVALIDPERMISSIONSMASK',
      })
    }

    const role = await Role.create({
      name: newRole.name,
      permissions: permissions,
      serverId: serverId,
    })
    return role.save()
  }

  async update(id: string, payload: UpdateRoleSchema): Promise<Role> {
    // Check for permissions validity
    if (!this.permissionsService.isValidMask(payload.permissions)) {
      throw new InvalidPermissionsMaskException('Invalid permissions mask', {
        status: 400,
        code: 'E_INVALIDPERMISSIONSMASK',
      })
    }

    const role = await Role.findOrFail(id)
    role.merge(payload)
    return role.save()
  }

  async deleteById(roleId: string): Promise<void> {
    const role: Role = await Role.findOrFail(roleId)
    await role.delete()
  }
}
