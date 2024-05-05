import type { HttpContext, Response } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import StorageService from '#apps/storage/services/storage_service'
import { createStorageValidator, updateStorageValidator } from '#apps/storage/validators/storage'
import StoragePolicy from '#apps/storage/policies/storage_policy'
import Attachment from '#apps/storage/models/attachment'
import User from '#apps/users/models/user'

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
  async store({ bouncer, auth, request }: HttpContext) {
    const payload = auth.use('jwt').payload
    if (!(payload && typeof payload.sub === 'string')) {
      return { error: 'User not found' }
    }
    const data = await request.validateUsing(createStorageValidator)
    await bouncer.with(StoragePolicy).authorize('create' as never)
    return await this.storageService.store(data)
  }

  /**
   * Show individual record
   */
  async show({ params }: HttpContext) {
    return this.storageService.show(params.id)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ bouncer, auth, request, response }: HttpContext) {
    const payload = auth.use('jwt').payload
    if (payload && typeof payload.sub === 'string') {
      const data = await request.validateUsing(updateStorageValidator)
      await bouncer.with(StoragePolicy).authorize('edit' as never)
      return await this.storageService.update(data)
    }
    return response.unauthorized()
  }

  /**
   * Delete record
   */
  async destroy({ bouncer, params }: HttpContext) {
    await bouncer.with(StoragePolicy).authorize('delete' as never)
    return await this.storageService.destroy(params.id)
  }

  async transmitAttachment({ params, response }: HttpContext) {
    const attachment = await Attachment.findByOrFail('id', params.id)
    return await this.transmit(response, attachment.name)
  }

  async transmitProfilePicture({ params, response }: HttpContext) {
    const user = await User.findByOrFail('id', params.id)
    return await this.transmit(response, user.profilePicture)
  }

  async transmit(response: Response, id: string) {
    const payload = await this.storageService.transmit(id)
    if (payload.Body) {
      response.type('application/octet-stream')
      //@ts-ignore
      return response.stream(payload.Body)
    }
    return response.notFound()
  }
}
