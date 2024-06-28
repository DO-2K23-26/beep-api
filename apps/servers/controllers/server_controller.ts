import { Payload } from '#apps/authentication/contracts/payload'
import ServerService from '#apps/servers/services/server_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import {
  indexServerValidator,
  createServerValidator,
  updateServerValidator,
  updateBannerValidator,
  updatePictureValidator,
} from '#apps/servers/validators/server'
import ServerPolicy from '../policies/server_policy.js'
import InvitationService from '#apps/invitations/services/invitation_service'

@inject()
export default class ServersController {
  constructor(
    private serverService: ServerService,
    private invitationService: InvitationService
  ) {}

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
    await this.invitationService.joinPublic(userPayload.sub.toString(), server.id)
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

  async update({ request, params, bouncer }: HttpContext) {
    const payload = await request.validateUsing(updateServerValidator)
    const server = await this.serverService.findById(params.serverId)
    await bouncer.with(ServerPolicy).authorize('edit' as never, server)
    return this.serverService.update(params.serverId, payload)
  }

  /**
   * Delete record
   */
  // async destroy({ params }: HttpContext) {}

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

  //Banner

  //update banner
  async updateBanner({ request, bouncer }: HttpContext) {
    const data = await request.validateUsing(updateBannerValidator)
    const server = await this.serverService.findById(data.params.serverId)
    await bouncer.with(ServerPolicy).authorize('edit' as never, server)
    return this.serverService.updateBanner(data)
  }

  // update picture
  async updatePicture({ request, bouncer }: HttpContext) {
    const data = await request.validateUsing(updatePictureValidator)
    console.log(data)
    const server = await this.serverService.findById(data.params.serverId)
    await bouncer.with(ServerPolicy).authorize('edit' as never, server)
    return this.serverService.updatePicture(data)
  }

  async destroy({ params, response, auth }: HttpContext) {
    const owner = await this.serverService.getOwner(params.serverId)
    //TODO: Replace with correct authorization managemen/*  */t
    const userPayload = auth.use('jwt').payload as Payload
    if (owner !== userPayload.sub.toString()) {
      return response.status(403).send({ message: 'You are not allowed to delete this server' })
    }
    await this.serverService.delete(params.serverId)
    return response.send({ message: 'Server deleted successfully' })
  }
}
