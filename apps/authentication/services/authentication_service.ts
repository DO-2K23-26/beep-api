import { CreateAuthenticationSchema } from '#apps/authentication/validators/authentication'
import { UpdatePasswordValidator } from '#apps/authentication/validators/verify'
import UserNotFoundException from '#apps/users/exceptions/user_not_found_exception'
import Token from '#apps/users/models/token'
import User from '#apps/users/models/user'
import env from '#start/env'
import { errors } from '@adonisjs/auth'
import logger from '@adonisjs/core/services/logger'
import jwt from 'jsonwebtoken'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import redis from '@adonisjs/redis/services/main'

export default class AuthenticationService {
  DEFAULT_PP_URL = 'default_profile_picture.png'

  async verifyToken(token: string) {
    try {
      const decodedToken = jwt.decode(token, { complete: true })
      const algorithm = decodedToken?.header.alg as jwt.Algorithm

      return jwt.verify(token, env.get('APP_KEY'), { algorithms: [algorithm] })
    } catch (e) {
      logger.warn(e)
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: 'jwt',
      })
    }
  }

  async registerUser(schemaUser: CreateAuthenticationSchema): Promise<User> {
    const user = await User.create({
      username: schemaUser.username,
      firstName: schemaUser.firstname,
      lastName: schemaUser.lastname,
      email: schemaUser.email.toLowerCase(),
      password: schemaUser.password,
      profilePicture: this.DEFAULT_PP_URL,
    })

    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await User.findBy('email', email.toLowerCase())

    return user
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await User.findBy('username', username)

    return user
  }

  async createToken(user: User): Promise<Token> {
    const currentDate: DateTime = DateTime.now()

    const token = await Token.create({
      token: crypto.randomBytes(100).toString('hex'),
      ownerId: user.id,
      createdAt: currentDate,
      desactivatedAt: currentDate.plus({
        hour: 2,
      }),
    })

    return token
  }

  async verifyEmail(token: string): Promise<boolean> {
    const tokenEntity = await Token.query().where('token', token).firstOrFail()

    const user = await User.findOrFail(tokenEntity.ownerId).catch(() => {
      throw new UserNotFoundException('User not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })

    if (user.verifiedAt !== null) return true

    if (tokenEntity.desactivatedAt < DateTime.now()) return false

    user.verifiedAt = DateTime.now()
    await user.save()

    return true
  }

  async updateNewPassword(email: string, validator: UpdatePasswordValidator) {
    // On vérifie les mots de passes
    const user = await User.verifyCredentials(email, validator.oldPassword)

    // Si les mdp correspondent on maj
    user.password = validator.newPassword
    await user.save()
  }

  async verifyResetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokenEntity = await Token.query().where('token', token).firstOrFail()
    const user = await User.findOrFail(tokenEntity.ownerId).catch(() => {
      throw new UserNotFoundException()
    })

    if (tokenEntity.desactivatedAt < DateTime.now()) return false

    if (user === null) return false

    user.password = newPassword
    await user.save()

    return true
  }

  async generateQRCodeToken() {
    const token = crypto.randomBytes(100).toString('hex')
    await redis.set(`qr-code:${token}`, 'false', 'EX', 300)

    return token
  }
}
