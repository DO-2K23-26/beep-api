import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import StorageService from '#apps/storage/services/storage_service'
@inject()
export default class StoragesController {
  constructor(private storageService: StorageService) {}

  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ request }: HttpContext) {
    return await this.storageService.store(request)
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    return await this.storageService.show(params)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request }: HttpContext) {}

  /**
   * Delete record
   */
  async destroy({ params }: HttpContext) {
    return await this.storageService.destroy(params)
  }
}
