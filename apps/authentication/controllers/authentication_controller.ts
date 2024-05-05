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

    const verificationToken: Token = await this.authenticationService.createVerificationToken(user)

    const emailContent: string =
      "<p>Bonjour $_PRENOM_$,</p><p>Veuillez trouver ci-dessous un bouton pour faire vérifier votre compte :</p><div style='text-align: center; margin: 40px 0;'><a href='$_URL_TOKEN_$' style='background-color: #4a7ab4; padding: 10px; border-radius: 10px; margin: 0 auto; color: white; text-decoration: none;'>Vérifier mon compte</a></div><p>Ce bouton possède une durée de validité de <span style='font-weight: bold; text-decoration: underline;'>$_TEMPS_VALIDITE_TOKEN_$ heures</span> à compter de la réception de ce mail.</p><p>Si vous n'êtes pas l'auteur de cette demande, merci de ne pas tenir compte de ce message.</p>"
        .replace('$_PRENOM_$', user.firstName)
        .replace(
          '$_URL_TOKEN_$',
          `${env.get('FRONTEND_URL')}/authentication/verify/` + verificationToken.token
        )
        .replace('$_TEMPS_VALIDITE_TOKEN_$', '2')

    this.mailService.sendMail(user.email, 'Bienvenue sur Beep', emailContent)

    return { user }
  }

  async refresh({ response, request, auth }: HttpContext) {
    const { refreshToken } = request.only(['refreshToken'])

    const payload = await this.authenticationService.verifyToken(refreshToken)

    const user = await User.query()
      .where('id', payload.sub as string)
      .preload('roles')
      .firstOrFail()

    const tokens = await auth.use('jwt').generate(user)

    return response.send({
      ...tokens,
    })
  }

  async sendEmail({ auth, response }: HttpContext) {
    const payload = auth.use('jwt').payload!

    if (payload.sub === undefined) return response.status(401).send({ message: 'Unauthorized' })
    const user = await this.userService.findById(payload.sub.toString())
    const verificationToken = await this.authenticationService.createVerificationToken(user)

    const emailContent: string =
      "<p>Bonjour $_PRENOM_$,</p><p>Veuillez trouver ci-dessous un bouton pour faire vérifier votre compte :</p><div style='text-align: center; margin: 40px 0;'><a href='$_URL_TOKEN_$' style='background-color: #4a7ab4; padding: 10px; border-radius: 10px; margin: 0 auto; color: white; text-decoration: none;'>Vérifier mon compte</a></div><p>Ce bouton possède une durée de validité de <span style='font-weight: bold; text-decoration: underline;'>$_TEMPS_VALIDITE_TOKEN_$ heures</span> à compter de la réception de ce mail.</p><p>Si vous n'êtes pas l'auteur de cette demande, merci de ne pas tenir compte de ce message.</p>"
        .replace('$_PRENOM_$', user.firstName)
        .replace(
          '$_URL_TOKEN_$',
          `${env.get('FRONTEND_URL')}/authentication/verify/` + verificationToken.token
        )
        .replace('$_TEMPS_VALIDITE_TOKEN_$', '2')

    await this.mailService.sendMail(user.email, 'Bienvenue sur Beep', emailContent)

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
