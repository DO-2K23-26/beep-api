import MailService from '#apps/authentication/services/mail_service'
import HttpException from '#apps/shared/exceptions/http-exception'
import drive from '#apps/shared/services/disk'
import User from '#apps/users/models/user'
import { UpdateUserValidator } from '#apps/users/validators/users'
import { inject } from '@adonisjs/core'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'
import { readFileSync } from 'fs'
import jwt from 'jsonwebtoken'
import { ChangeEmailToken } from '../models/change_email_token.js'

@inject()
export default class UserService {
  constructor(protected mailService: MailService) {}
  async findAll() {
    return User.query().preload('roles')
  }

  async findAllToDisplay() {
    return User.query().select('id', 'username')
  }

  async findById(userId: string): Promise<User> {
    try {
      return User.query().where('id', userId).firstOrFail()
    } catch (error) {
      throw new HttpException('No user has been found with this ID.', { status: 404 })
    }
  }

  async create(data: {
    username: string
    firstName: string
    lastName: string
    email: string
    password: string
  }) {
    return User.create(data)
  }

  async update(updatedUser: UpdateUserValidator, userId: string) {
    const user = await User.findOrFail(userId)
    const { ['profilePicture']: file, ...restOfObject } = updatedUser

    console.log(user)
    if (updatedUser?.profilePicture?.tmpPath) {
      const key = 'profilePictures/' + userId + '/' + updatedUser.profilePicture.clientName
      const buffer = Buffer.from(readFileSync(updatedUser.profilePicture.tmpPath))
      console.log(key)
      user.merge({ profilePicture: key })
      drive.put(key, buffer)
    }
    console.log(user)
    await user.merge(restOfObject).save()
    return user
  }

  async storeEmailChangeToken(userId: string, oldEmail: string, newEmail: string) {
    const id = crypto.randomUUID()
    const key = `change_email:${id}`
    const payload = {
      id: id,
    }
    const token = jwt.sign(payload, 'test')
    await redis.hmset(key, {
      user_id: userId,
      new_email: newEmail,
    })

    await redis.expire(key, 20) //one day
    console.log('mail outside')
    this.mailService.sendEmailUpdateMail(oldEmail, token)
    return token
  }

  async getEmailChangeToken(token: string): Promise<ChangeEmailToken> {
    const decodedToken = jwt.verify(token, 'test') as jwt.JwtPayload
    const key = `change_email:${decodedToken.id}`
    const data = await redis.hgetall(key)
    return { new_email: data.new_email, user_id: data.user_id }
  }

  updateEmail(userId: string, email: string) {
    const changeEmailValidator: UpdateUserValidator = {
      username: undefined,
      firstName: undefined,
      lastName: undefined,
      email: email,
      profilePicture: undefined,
    }
    return this.update(changeEmailValidator, userId)
  }
  async changeMutedStatus(
    userId: string,
    serverId: any,
    payload: { muted: boolean; voiceMuted: boolean }
  ) {
    redis.hset(`users:${serverId}`, userId, JSON.stringify(payload))
    transmit.broadcast(`users/${serverId}/state`, { message: 'update muted' })
  }
}
