import RoleService from '#apps/roles/services/role_service'
import { createRoleValidator, updateRoleValidator } from '#apps/roles/validators/role'
import ServerRolePolicy from '#apps/servers/policies/server_role_policy'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import ServerService from '../services/server_service.js'

@inject()
export default class ServerRolesController {
  constructor(
    private roleService: RoleService,
    private serverService: ServerService
  ) {}

  /**
   * Create a new role.
   */
  async create({ request, params, response, bouncer }: HttpContext) {
    const server = await this.serverService.findById(params.serverId)
    await bouncer.with(ServerRolePolicy).authorize('create' as never, server)
    const payload = await request.validateUsing(createRoleValidator)
    const role = await this.roleService.create(payload, params.serverId)
    return response.created(role)
  }

  /**
   * Return list of all roles by server ID.
   */
  async index({ params, bouncer }: HttpContext) {
    const server = await this.serverService.findById(params.serverId)
    await bouncer.with(ServerRolePolicy).authorize('view' as never, server)
    return this.roleService.findAllByServer(params.serverId)
  }

  /**
   * Display a single role by id.
   */
  async show({ params, bouncer }: HttpContext) {
    const server = await this.serverService.findById(params.serverId)
    await bouncer.with(ServerRolePolicy).authorize('view' as never, server)
    return this.roleService.findById(params.roleId)
  }

  /**
   * Handle the form submission to update a specific role by id
   */
  async update({ params, request, response, bouncer }: HttpContext) {
    const receivedRole = await request.validateUsing(updateRoleValidator)
    const server = await this.serverService.findById(params.serverId)
    await bouncer.with(ServerRolePolicy).authorize('update' as never, server)
    const role = await this.roleService.update(params.roleId, receivedRole)
    return response.send(role)
  }

  /**
   * Handle the form submission to delete a specific role by id.
   */
  async destroy({ params, bouncer }: HttpContext) {
    const roleId = params.roleId
    const server = await this.serverService.findById(params.serverId)
    await bouncer.with(ServerRolePolicy).authorize('destroy' as never, server)
    await this.roleService.deleteById(roleId)
    return { message: 'Role deleted successfully' }
  }
}
