import { CreateAuthenticationSchema } from '#apps/authentication/validators/authentication'
import { UpdatePasswordValidator } from '#apps/authentication/validators/verify'
import EmailAlreadyExistsExeption from '#apps/users/exceptions/email_already_exists_exeption'
import UserNotFoundException from '#apps/users/exceptions/user_not_found_exception'
import UsernameAlreadyExistsExeption from '#apps/users/exceptions/username_already_exists_exeption'
import Token from '#apps/users/models/token'
import User from '#apps/users/models/user'
import env from '#start/env'
import { Authenticator, errors } from '@adonisjs/auth'
import logger from '@adonisjs/core/services/logger'
import jwt from 'jsonwebtoken'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'
import { Authenticators } from '@adonisjs/auth/types'

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
    const usernameExists = await User.findBy('username', schemaUser.username)
    if (usernameExists) {
      throw new UsernameAlreadyExistsExeption('Username already exists', {
        code: 'E_USERNAME_ALREADY_EXISTS',
        status: 400,
      })
    }

    const emailExists = await User.findBy('email', schemaUser.email.toLowerCase())
    if (emailExists) {
      throw new EmailAlreadyExistsExeption('User already exists', {
        code: 'E_MAIL_ALREADY_EXISTS',
        status: 400,
      })
    }

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
      throw new UserNotFoundException('User not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })

    if (tokenEntity.desactivatedAt < DateTime.now()) return false

    if (user === null) return false

    user.password = newPassword
    await user.save()

    return true
  }

  async generateQRCodeToken() {
    const token = crypto.randomBytes(100).toString('hex')
    await redis.set(`qr-code:${token}`, 'generated', 'EX', 300)

    return token
  }

  async validateQRCodeToken(token: string, userid: string): Promise<boolean> {
    const isValid = await redis.get(`qr-code:${token}`)
    if (isValid === 'pending') {
      const passKey = crypto.randomBytes(50).toString('hex')
      await redis.set(`qr-code:${token}`, 'validated', 'EX', 300)
      await redis.set(`qr-code:${token}:user`, userid, 'EX', 300)
      await redis.set(`qr-code:${token}:passkey`, passKey, 'EX', 300)
      transmit.broadcast(`qr-code/${token}`, `${passKey}`)
      return true
    }

    return false
  }

  async retrieveUserQRCode(token: string, passKey: string): Promise<User | null> {
    const isValid = await redis.get(`qr-code:${token}`)
    if (isValid !== 'validated') {
      return null
    }
    const passKeyStored = await redis.get(`qr-code:${token}:passkey`)
    if (passKeyStored !== passKey) {
      return null
    }
    const userId = await redis.get(`qr-code:${token}:user`)
    await redis.del(`qr-code:${token}:user`)
    await redis.del(`qr-code:${token}`)
    await redis.del(`qr-code:${token}:passkey`)
    const user = await User.findOrFail(userId).catch(() => {
      throw new UserNotFoundException('User not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })
    return user
  }

  async handleSignIn(user: User, auth: Authenticator<Authenticators>) {
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

    return {
      user,
      tokens,
    }
  }
}
