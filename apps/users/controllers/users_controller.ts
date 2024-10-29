import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import UserService from '#apps/users/services/user_service'
import UserPolicy from '#apps/users/policies/user_policy'



@inject()
export default class UsersController {
  constructor(
    protected userService: UserService,
  ) { }

  async index({ bouncer }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('view' as never)

  }
}
