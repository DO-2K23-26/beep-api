import { errors } from '@adonisjs/auth'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { CreateAuthenticationSchema } from '../validators/authentication.js'
import User from '#apps/users/models/user'

export default class AuthenticationService {
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
      email: schemaUser.username,
      password: schemaUser.password,
    })

    return user
  }
}
