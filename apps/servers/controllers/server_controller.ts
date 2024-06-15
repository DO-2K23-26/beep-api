import { Payload } from '#apps/authentication/contracts/payload'
import ServerService from '#apps/servers/services/server_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import {
  indexServerValidator,
  createServerValidator,
  updateServerValidator,
} from '#apps/servers/validators/server'

@inject()
export default class ServersController {
  constructor(private serverService: ServerService) {}

  /**
   * Display a list of resource
   */
  //Liste les servers en fonction de l'id du user
  async index({ request, auth }: HttpContext) {
    const userPayload = auth.use('jwt').payload as Payload
    const payload = await request.validateUsing(indexServerValidator)
    const servers = await this.serverService.findByUserId(
      userPayload.sub,
      payload.page,
      payload.limit
    )
    return servers
  }

  /**
   * Handle form submission for the create action
   */
  async store({ auth, request }: HttpContext) {
    const payload = await request.validateUsing(createServerValidator)
    const userPayload = auth.use('jwt').payload as Payload
    const server = await this.serverService.create(payload, userPayload.sub)
    await this.serverService.join(userPayload.sub.toString(), server.id)
    return server
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    return this.serverService.findById(params.serverId)
  }

  /**
   * Mettre à jour un serveur (nom,description)
   */

  async update({ request, params }: HttpContext) {
    const payload = await request.validateUsing(updateServerValidator)
    return this.serverService.update(params.serverId, payload)
  }

  /**
   * Delete record
   */
  // async destroy({ params }: HttpContext) {}

  //permet à un utilisateur de rejoindre un serveur
  async join({ auth, response, params }: HttpContext) {
    const userPayload = auth.use('jwt').payload as Payload
    const serverId = params.serverId
    await this.serverService.join(userPayload.sub.toString(), serverId)
    return response.send({ message: 'User joined successfully' })
  }

  //récupère le proprio du serveur
  async getOwner({ params }: HttpContext) {
    const ownerId = await this.serverService.getOwner(params.serverId)
    return { ownerId: ownerId }
  }

  async getAllUsers({ params }: HttpContext) {
    // const userPayload = auth.use('jwt').payload as Payload

    // const userServers: Server[] = await this.serverService.findByUserId(userPayload.sub.toString())

    // console.log(userServers)
    // if (!userServers.includes(params.serverId)) {
    //   return response.status(403).send({ message: 'You are not allowed to access this server' })
    // }

    return this.serverService.findUsersByServerId(params.serverId)
  }

  // //permet de savoir si un user est timeout sur un server
  // async timeout({ request, response }: HttpContext) {
  //   const data = await request.validateUsing(showServerValidator)
  //   const timeout = await this.serverService.timeout(data.params.id)
  //   return response.send(timeout)
  // }
}
