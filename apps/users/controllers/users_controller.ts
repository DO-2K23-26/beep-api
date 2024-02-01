import { type HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import UserService from "#apps/users/services/user_service";

@inject()
export default class UsersController {
  constructor(protected userService: UserService) {}

  public async index({ response }: HttpContext) {
    const users = await this.userService.findAll()

    return response.send(users)
  }
}
