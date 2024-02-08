import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import AuthenticationService from '#apps/authentication/services/authentication_service'
import User from "#apps/users/models/user";
import {JwtGuard} from "#apps/authentication/guards/jwt_guard";
@inject()
export default class AuthenticationController {
  constructor(private authenticationService: AuthenticationService) {}

  async login({ request, response, auth }: HttpContext) {
    const { username, password } = request.only(['username', 'password'])

    const user = await User.verifyCredentials(username, password)
    await user.load('roles')

    const tokens = await auth.use('jwt').generate(user)

    return response.send({
      user,
      tokens
    })
  }

  async refresh({ response, request }: HttpContext) {
    const { refresh_token } = request.only(['refresh_token'])

    return response.send({
      refresh_token: 'test'
    })
  }
}
