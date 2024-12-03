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
import MailService from '../services/mail_service.js'
import {
  createAuthenticationValidator,
  resetPasswordValidator,
  signinAuthenticationValidator,
} from '../validators/authentication.js'
import { Authenticator } from '@adonisjs/auth'
import { Authenticators } from '@adonisjs/auth/types'
import { Payload } from '../contracts/payload.js'
import { SignIn } from '../contracts/signin.js'
import transmit from '@adonisjs/transmit/services/main'

@inject()
export default class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly mailService: MailService,
    private readonly userService: UserService
  ) {}

  async signin({ request, response, auth }: HttpContext) {
    // (email & password) OR (token & passKey) are required and verified by the validator
    const { email, password, token, passKey } = await request.validateUsing(
      signinAuthenticationValidator
    )
    let payload: SignIn
    if (token && passKey) {
      const user = await this.authenticationService.retrieveUserQRCode(token, passKey)
      if (!user) return response.status(401).send({ message: 'Unauthorized' })
      payload = await this.authenticationService.handleSignIn(user, auth)
    } else if (email && password) {
      const user = await User.verifyCredentials(email.toLocaleLowerCase(), password)
      payload = await this.authenticationService.handleSignIn(user, auth)
    } else {
      return response.status(401).send({ message: 'Unauthorized' })
    }

    response.cookie('beep.access_token', payload.tokens.accessToken)
    response.cookie('beep.refresh_token', payload.tokens.refreshToken)

    return response.status(200).send(payload)
  }

  async signup({ request, response }: HttpContext) {
    const schemaUser = await request.validateUsing(createAuthenticationValidator)
    const user: User = await this.authenticationService.registerUser(schemaUser)
    await this.mailService.sendSignUpMail(user)

    if (schemaUser.profilePicture) {
      user.profilePicture = await new StorageService().storeProfilePicture(
        schemaUser.profilePicture,
        user.id
      )
      await user.save()
    }

    return response.created(user)
  }

  async refresh({ response, request, auth }: HttpContext) {
    let { refreshToken } = request.only(['refreshToken'])

    if (!refreshToken) {
      refreshToken = request.cookie('beep.refresh_token')
    }

    if (!refreshToken) return response.status(401).send({ message: 'Unauthorized' })

    const tokens = await this.getTokens(refreshToken, auth)

    response.cookie('beep.access_token', tokens.accessToken)
    response.cookie('beep.refresh_token', tokens.refreshToken)

    return response.send(tokens)
  }

  async getTokens(refreshToken: string, auth: Authenticator<Authenticators>) {
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

    return {
      ...tokens,
    }
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

  async logout({ auth, response }: HttpContext) {
    const payload = auth.use('jwt').payload!
    await redis.hdel('userStates', payload.sub as string)
    transmit.broadcast('users/state', {
      message: 'update user connected',
    })
    // clean cookies
    response.clearCookie('beep.access_token')
    response.clearCookie('beep.refresh_token')
    return response.send({ message: 'User disconnected' })
  }

  async generateQRCodeToken({ response }: HttpContext) {
    const token = await this.authenticationService.generateQRCodeToken()

    return response.status(200).send({ token: token })
  }

  async validateQRCodeToken({ auth, response, params }: HttpContext) {
    const payload = auth.use('jwt').payload as Payload
    const token = params.token

    if (!payload?.sub) {
      return response.status(401).send({ message: 'Unauthorized' })
    }
    const isValid = await this.authenticationService.validateQRCodeToken(token, payload.sub)

    return isValid ? response.status(204) : response.status(401).send({ message: 'Unauthorized' })
  }
}
