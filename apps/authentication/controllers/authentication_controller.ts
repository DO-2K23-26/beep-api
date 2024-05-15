import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import AuthenticationService from '#apps/authentication/services/authentication_service'
import User from '#apps/users/models/user'
import { createAuthenticationValidator, signinAuthenticationValidator } from '../validators/authentication.js'
import MailService from '../services/mail_service.js'
import Token from '#apps/users/models/token'
import UserService from '#apps/users/services/user_service'
import env from '#start/env'
import { createVerifyValidator } from '../validators/verify.js'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'
import StorageService from "#apps/storage/services/storage_service";

@inject()
export default class AuthenticationController {
  constructor(
    private authenticationService: AuthenticationService,
    private mailService: MailService,
    private userService: UserService
  ) {}

  async signin({ request, response, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(signinAuthenticationValidator)
    const user = await User.verifyCredentials(email, password)
    await user.load('roles')

    const tokens = await auth.use('jwt').generate(user)

    await redis.hset(
      'userStates',
      user.id,
      JSON.stringify({
        id: user.id,
        username: user.username,
        expiresAt: Date.now() + 1200 * 1000  // Timestamp now + 20 minutes
      })
    )

    transmit.broadcast('users/state', {
      message: 'update user connected',
    })

    return response.send({
      user,
      tokens,
    })
  }

  async signup({ request }: HttpContext) {
    const schemaUser = await request.validateUsing(createAuthenticationValidator)

    const existingUser: User | null = await this.authenticationService.getUserByEmail(
      schemaUser.email
    )

    if (existingUser != null)
      return { error: 'Un utilisateur avec cette adresse email existe déjà.' }

    const user: User = await this.authenticationService.registerUser(schemaUser)
    await user.load('roles')
    await this.mailService.sendSignUpMail(user)

    if (schemaUser.profilePicture) {
      user.profilePicture = await new StorageService().storeProfilePicture(
        schemaUser.profilePicture,
        user.id
      )
      await user.save()
    }

    return { user }
  }

  async refresh({ response, request, auth }: HttpContext) {
    const { refreshToken } = request.only(['refreshToken'])

    const payload = await this.authenticationService.verifyToken(refreshToken)

    const user = await User.query()
      .where('id', payload.sub as string)
      .preload('roles')
      .firstOrFail()

    await redis.hset(
      'userStates',
      payload!.sub as string,
      JSON.stringify({
        id: payload!.sub,
        username: user.username as string,
        expiresAt: Date.now() + 1200 * 1000  // Nouveau timestamp d'expiration
      })
    );

    const tokens = await auth.use('jwt').generate(user)

    return response.send({
      ...tokens,
    })
  }

  async sendEmail({ auth, response }: HttpContext) {
    const payload = auth.use('jwt').payload!

    if (payload.sub === undefined) return response.status(401).send({ message: 'Unauthorized' })
    const user = await this.userService.findById(payload.sub.toString())
    await this.mailService.sendSignUpMail(user)

    return response.send({
      message: 'mail send',
    })
  }

  async verifyEmail({ response, request }: HttpContext) {
    const schematoken = await request.validateUsing(createVerifyValidator)

    const verificationStatus: boolean = await this.authenticationService.verifyEmail(
      schematoken.token
    )

    if (verificationStatus)
      return response.status(200).send({ message: 'Votre compte a bien été vérifié.' })
    else return response.status(400).send({ message: 'Le token de vérification est invalide.' })
  }
}
