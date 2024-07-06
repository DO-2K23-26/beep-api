import MailService from '#apps/authentication/services/mail_service'
import HttpException from '#apps/shared/exceptions/http_exception'
import User from '#apps/users/models/user'
import { UpdateUserValidator } from '#apps/users/validators/users'
import { inject } from '@adonisjs/core'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'
import jwt from 'jsonwebtoken'
import { ChangeEmailToken } from '../models/change_email_token.js'
import StorageService from '#apps/storage/services/storage_service'

@inject()
export default class UserService {
  constructor(
    protected mailService: MailService,
    protected storageService: StorageService
  ) {}
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

    if (updatedUser?.profilePicture?.tmpPath) {
      // The goal is to use this service in the end
      // const key = 'profilePictures/' + userId + '/' + updatedUser.profilePicture.clientName
      // const buffer = Buffer.from(readFileSync(updatedUser.profilePicture.tmpPath))
      // console.log(key)
      // drive.put(key, buffer)
      const key = await this.storageService.storeProfilePicture(updatedUser.profilePicture, user.id)
      user.merge({ profilePicture: key })
    }
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
