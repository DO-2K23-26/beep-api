import AuthenticationService from '#apps/authentication/services/authentication_service'
import {
  createVerifyValidator,
  resetPasswordVerifyValidator,
  updatePasswordValidator,
} from '#apps/authentication/validators/verify'
import StorageService from '#apps/storage/services/storage_service'
import User from '#apps/users/models/user'
import UserService from '#apps/users/services/user_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'
import MailService from '../services/mail_service.js'
import {
  createAuthenticationValidator,
  resetPasswordValidator,
  signinAuthenticationValidator,
} from '../validators/authentication.js'

@inject()
export default class AuthenticationController {
  constructor(
    private authenticationService: AuthenticationService,
    private mailService: MailService,
    private userService: UserService
  ) {}

  async signin({ request, response, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(signinAuthenticationValidator)
    const user = await User.verifyCredentials(email.toLocaleLowerCase(), password)

    const tokens = await auth.use('jwt').generate(user)

    await redis.hset(
      'userStates',
      user.id,
      JSON.stringify({
        id: user.id,
        username: user.username,
        expiresAt: Date.now() + 1200 * 1000, // Timestamp now + 20 minutes
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

  async signup({ request, response }: HttpContext) {
    const schemaUser = await request.validateUsing(createAuthenticationValidator)

    const existingUserEmail: User | null = await this.authenticationService.getUserByEmail(
      schemaUser.email.toLocaleLowerCase()
    )

    if (existingUserEmail !== null)
      return response
        .status(403)
        .send({ message: 'A user already exists with this email address.' })

    const existingUserUsername: User | null = await this.authenticationService.getUserByUsername(
      schemaUser.username
    )

    if (existingUserUsername !== null)
      return response.status(403).send({ message: 'A user already exists with this username.' })

    const user: User = await this.authenticationService.registerUser(schemaUser)
    await this.mailService.sendSignUpMail(user)

    if (schemaUser.profilePicture) {
      user.profilePicture = await new StorageService().storeProfilePicture(
        schemaUser.profilePicture,
        user.id
      )
      await user.save()
    }

    return response.status(201).send(user)
  }

  async refresh({ response, request, auth }: HttpContext) {
    const { refreshToken } = request.only(['refreshToken'])

    const payload = await this.authenticationService.verifyToken(refreshToken)

    const user = await User.query()
      .where('id', payload.sub as string)
      //.preload('roles')
      .firstOrFail()

    await redis.hset(
      'userStates',
      payload.sub as string,
      JSON.stringify({
        id: payload.sub,
        username: user.username,
        expiresAt: Date.now() + 1200 * 1000, // Nouveau timestamp d'expiration
      })
    )

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

  async sendResetPasswordEmail({ response, request }: HttpContext) {
    const req = await request.validateUsing(resetPasswordValidator)
    await this.mailService.sendResetPasswordMail(req)

    return response.send({
      message: 'mail send',
    })
  }

  async verifyEmail({ response, request }: HttpContext) {
    const schematoken = await request.validateUsing(createVerifyValidator)

    await this.authenticationService.verifyEmail(schematoken.token)

    return response.status(200).send({ message: 'Your account has been verified.' })
  }

  // Mise à jour du mot de passe
  async updatePassword({ auth, request, response }: HttpContext) {
    const validator = await request.validateUsing(updatePasswordValidator)
    const payload = auth.use('jwt').payload!

    await this.authenticationService.updateNewPassword(payload.email, validator)

    return response.send({ message: 'Password updated successfully.' })
  }

  async verifyResetPassword({ response, request }: HttpContext) {
    const schematoken = await request.validateUsing(resetPasswordVerifyValidator)

    await this.authenticationService.verifyResetPassword(schematoken.token, schematoken.newPassword)

    return response.status(200).send({ message: 'Your password has been updated.' })
  }

  async generateQRCodeToken({ response }: HttpContext) {
    const token = await this.authenticationService.generateQRCodeToken()

    return response.status(200).send({ token: token })
  }
}
