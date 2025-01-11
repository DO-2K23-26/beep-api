import MailService from '#apps/authentication/services/mail_service'
import { generateSnowflake } from '#apps/shared/services/snowflake'
import StorageService from '#apps/storage/services/storage_service'
import User from '#apps/users/models/user'
import {
  GetUsersSchema,
  UpdateUserValidator,
  OldEmailUpdateValidator,
  CreateUserValidator,
} from '#apps/users/validators/users'
import { inject } from '@adonisjs/core'
import redis from '@adonisjs/redis/services/main'
import jwt from 'jsonwebtoken'
import { ChangeEmailToken } from '#apps/users/models/change_email_token'
import UserNotFoundException from '#apps/users/exceptions/user_not_found_exception'
import UsernameAlreadyExistsExeption from '#apps/users/exceptions/username_already_exists_exception'
import EmailAlreadyExistsExeption from '#apps/users/exceptions/email_already_exists_exception'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class UserService {
  DEFAULT_PP_URL = 'default_profile_picture.png'

  constructor(
    protected mailService: MailService,
    protected storageService: StorageService
  ) {}

  async findAll({ page = 1, limit = 10 }: GetUsersSchema) {
    return User.query().paginate(page, limit)
  }

  async findFrom(userIds: string[]) {
    return User.query().whereIn('id', userIds)
  }

  async findAllToDisplay() {
    return User.query().select('id', 'username')
  }

  async findById(userId: string): Promise<User> {
    return User.findOrFail(userId)
  }

  async create(user: CreateUserValidator) {
    const usernameExists = await User.findBy('username', user.username)
    if (usernameExists) {
      throw new UsernameAlreadyExistsExeption('Username already exists', {
        code: 'E_USERNAME_ALREADY_EXISTS',
        status: 400,
      })
    }
    const emailExists = await User.findBy('email', user.email.toLowerCase())
    if (emailExists) {
      throw new EmailAlreadyExistsExeption('User already exists', {
        code: 'E_MAIL_ALREADY_EXISTS',
        status: 400,
      })
    }
    const sn = generateSnowflake()
    const userCreationTransaction = await db.transaction()
    let createdUser = new User()
    try {
      createdUser = await User.create(
        {
          username: user.username,
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.email,
          password: user.password,
          profilePicture: this.DEFAULT_PP_URL,
          serialNumber: sn,
        },
        { client: userCreationTransaction }
      )
      if (user.profilePicture) {
        const path = 'profilePictures/' + createdUser.id + '/' + user.profilePicture.clientName
        user.profilePicture.moveToDisk(path)
        createdUser.profilePicture = path
      }
      await createdUser.save()
      await userCreationTransaction.commit()
    } catch (error) {
      await userCreationTransaction.rollback()
      throw error
    }

    return createdUser
  }

  async update(updatedUser: UpdateUserValidator, userId: string) {
    const user = await User.findOrFail(userId).catch(() => {
      throw new UserNotFoundException('User not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ['profilePicture']: file, ...restOfObject } = updatedUser

    if (updatedUser?.profilePicture?.tmpPath) {
      const key = await this.storageService.storeProfilePicture(updatedUser.profilePicture, user.id)
      user.merge({ profilePicture: key })
    }
    if (updatedUser.email) {
      this.mailService.sendChangeConfirmationMail(updatedUser.email)
    }

    await user
      .merge(restOfObject)
      .save()
      .catch(() => {
        if (updatedUser.username) {
          throw new UsernameAlreadyExistsExeption('Username already exists', {
            status: 400,
            code: 'E_USERNAMEALREADYEXISTS',
          })
        }
        if (updatedUser.email) {
          throw new EmailAlreadyExistsExeption('Email already exists', {
            status: 400,
            code: 'E_EMAILALREADYEXISTS',
          })
        }
      })
    return user
  }

  async getSn(userId: string): Promise<string> {
    const user = await User.query().where('id', userId).firstOrFail()
    return user.serialNumber
  }

  async storeEmailChangeToken(userId: string, oldEmail: string, newEmail: string) {
    const id = generateSnowflake()
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

  async updateEmail(updateEmail: OldEmailUpdateValidator) {
    // if the current password is not right

    const user = await User.verifyCredentials(
      updateEmail.oldEmail.toLocaleLowerCase(),
      updateEmail.password
    ).catch(() => {
      throw new UserNotFoundException('Password not right', {
        status: 404,
        code: 'E_ROW_NOTFOUND',
      })
    })

    const changeEmailValidator: UpdateUserValidator = {
      email: updateEmail.newEmail,
    }

    return this.update(changeEmailValidator, user.id)
  }
}
