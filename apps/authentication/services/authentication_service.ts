import { errors } from '@adonisjs/auth'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { CreateAuthenticationSchema } from '../validators/authentication.js'
import User from '#apps/users/models/user'
import Token from '#apps/users/models/token'
import crypto from 'crypto';
import { DateTime } from 'luxon'

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
      username: schemaUser.username,
      firstName: schemaUser.firstname,
      lastName: schemaUser.lastname,
      email: schemaUser.email,
      password: schemaUser.password,
    })

    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await User.findBy('email', email);

    return user;
  }

  async createVerificationToken(user: User): Promise<Token> {
    const currentDate: DateTime = DateTime.now();

    const token = await Token.create({
      token: crypto.randomBytes(100).toString('hex'),
      ownerId: user.id,
      createdAt: currentDate,
      desactivatedAt: currentDate.plus({
        hour: 2,
      })
    });

    return token;
  }

  async verifyEmail(email: string, token: string): Promise<boolean> {
    let user: User | null = await User.findBy('email', email);

    if (user == null)
      return false;

    if (user.verifiedAt != null)
      return true;

    const tokenObj: Token | null = await Token.query()
      .where('token', token)
      .where('ownerId', user.id)
      .first();

    if (tokenObj == null)
      return false;

    if (tokenObj.desactivatedAt < DateTime.now())
      return false;

    user.verifiedAt = DateTime.now();
    await user.save();

    return true;
  }
}
