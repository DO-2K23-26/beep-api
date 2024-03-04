import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import StorageService from '#apps/storage/services/storage_service'
import { createStorageValidator, updateStorageValidator } from '#apps/storage/validators/storage'
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
  async store({ auth, request }: HttpContext) {
    const payload = auth.use('jwt').payload
    if (!(payload && typeof payload.sub === 'string')) {
      return { error: 'User not found' }
    }
    const data = await request.validateUsing(createStorageValidator, {
      meta: {
        ownerId: payload.sub,
      },
    })
    return await this.storageService.store(data)
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    return await this.storageService.show(params.id)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ auth, request, response }: HttpContext) {
    const payload = auth.use('jwt').payload
    if (payload && typeof payload.sub === 'string') {
      const data = await request.validateUsing(updateStorageValidator, {
        meta: {
          ownerId: payload.sub,
        },
      })
      return await this.storageService.update(data)
    }
    return response.unauthorized()
  }

  /**
   * Delete record
   */
  async destroy({ params }: HttpContext) {
    return await this.storageService.destroy(params.id)
  }
}
