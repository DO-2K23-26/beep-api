import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import ServerService from '#apps/servers/services/server_service'
@inject()
export default class ServersController {
  constructor(private serverService: ServerService) {}

  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ request }: HttpContext) {}

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request }: HttpContext) {}

  /**
   * Delete record
   */
  async destroy({ params }: HttpContext) {}
}