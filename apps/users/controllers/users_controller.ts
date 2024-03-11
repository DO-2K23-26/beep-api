import { type HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import UserService from '#apps/users/services/user_service'
import UserPolicy from '#apps/users/policies/user_policy'

@inject()
export default class UsersController {
  constructor(protected userService: UserService) {}

  async index({ response, bouncer }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('view' as never)
    const users = await this.userService.findAll()

    return response.send(users)
  }

  async register({ request, response }: HttpContext) {
    const data = request.only(['email', 'password'])
    const user = await this.userService.create(data)

    return response.send(user)
  }
}
