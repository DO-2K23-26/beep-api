import RoleService from '#apps/roles/services/role_service'
import { createRoleValidator, updateRoleValidator } from '#apps/roles/validators/role'
import ServerRolePolicy from '#apps/servers/policies/server_role_policy'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ServerRolesController {
  constructor(private roleService: RoleService) {}

  /**
   * Create a new role.
   */
  async create({ request, params, response, bouncer }: HttpContext) {
    const payload = await request.validateUsing(createRoleValidator)
    await bouncer.with(ServerRolePolicy).authorize('create' as never, params.serverId)
    const role = await this.roleService.create(payload, params.serverId)
    return response.created(role)
  }

  /**
   * Return list of all roles by server ID.
   */
  async index({ params, bouncer }: HttpContext) {
    await bouncer.with(ServerRolePolicy).authorize('view' as never, params.serverId)
    return this.roleService.findAllByServer(params.serverId)
  }

  /**
   * Display a single role by id.
   */
  async show({ params, bouncer }: HttpContext) {
    await bouncer.with(ServerRolePolicy).authorize('view' as never, params.serverId)
    // ####### big commentaire à hugo, .findById() prend ShowRoleSchema en paramètre
    //return this.roleService.findById({ params: { id: params.roleId } })
  }

  /**
   * Handle the form submission to update a specific role by id
   */
  async update({ params, request, response, bouncer }: HttpContext) {
    const receivedChannel = await request.validateUsing(updateRoleValidator)
    await bouncer.with(ServerRolePolicy).authorize('update' as never, params.serverId)
    const role = await this.roleService.update(params.channelId, receivedChannel)
    return response.send(role)
  }

  /**
   * Handle the form submission to delete a specific role by id.
   */
  async destroy({ params }: HttpContext) {
    const channelId = params.channelId
    await this.roleService.deleteById(channelId)
    return { message: 'Role deleted successfully' }
  }
}
