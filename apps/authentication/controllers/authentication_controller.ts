import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import AuthenticationService from '#apps/authentication/services/authentication_service'
import User from '#apps/users/models/user'
import { createAuthenticationValidator } from '../validators/authentication.js'

@inject()
export default class AuthenticationController {
  constructor(private authenticationService: AuthenticationService) {}

  async login({ request, response, auth }: HttpContext) {
    const { username, password } = request.only(['username', 'password'])

    console.log(username, password)
    const user = await User.verifyCredentials(username, password)
    await user.load('roles')

    const tokens = await auth.use('jwt').generate(user)

    return response.send({
      user,
      tokens,
    })
  }

  async register({ request, auth }: HttpContext) {
    const schemaUser = await request.validateUsing(createAuthenticationValidator)

    const user = await this.authenticationService.registerUser(schemaUser)
    await user.load('roles')
    const tokens = await auth.use('jwt').generate(user)

    return { user, tokens }
  }

  async refresh({ response, request, auth }: HttpContext) {
    const { refresh_token } = request.only(['refresh_token'])

    console.log(refresh_token)

    const payload = await this.authenticationService.verifyToken(refresh_token)

    const user = await User.query()
      .where('id', payload.sub as string)
      .preload('roles')
      .firstOrFail()

    const tokens = await auth.use('jwt').generate(user)

    return response.send({
      ...tokens,
    })
  }
}
