import { type HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import UserService from '#apps/users/services/user_service'
import UserPolicy from '#apps/users/policies/user_policy'
import User from '#apps/users/models/user'
import { confirmEmailUpdateValidator, emailUpdateValidator, updateUserValidator } from '#apps/users/validators/users'
import AuthenticationService from '#apps/authentication/services/authentication_service'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'

@inject()
export default class UsersController {
  constructor(
    protected userService: UserService,
    protected authenticationService: AuthenticationService
  ) { }

  async index({ response, bouncer }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('view' as never)
    const users = await this.userService.findAll()

    return response.send(users)
  }

  async show({ params, response }: HttpContext) {
    try {
      const user: User = await this.userService.findById(params.userId)
      return response.send({
        id: user.id,
        username: user.username
      })
    } catch (error) {
      return response.status(404).send({
        message: 'No user has been found with this ID.',
      })
    }
  }

  async connectUser({ response, auth }: HttpContext) {
    const payload = auth.use('jwt').payload

    await redis.hset(
      'userStates',
      payload!.sub as string,
      JSON.stringify({
        id: payload!.sub,
        username: (payload as any).username as string,
        expiresAt: Date.now() + 1200 * 1000  // Timestamp now + 20 minutes
      })
    )

    transmit.broadcast('users/state', {
      message: 'update user connected',
    })

    return response.send({
      message: 'User connected',
    })
  }

  async disconnectUser({ response, auth }: HttpContext) {
    const payload = auth.use('jwt').payload

    await redis.hdel('userStates', payload!.sub as string)

    transmit.broadcast('users/state', {
      message: 'new user disconnected',
    })

    return response.send({
      message: 'User disconnected',
    })
  }

  async all({ response }: HttpContext) {
    const users = await this.userService.findAllToDisplay()

    return response.send(users)
  }

  async onlines({ response }: HttpContext) {
    const userStates = await redis.hgetall('userStates')

    let isUpdateRedis: boolean = false

    for (const userKey in userStates) {
      const userData = JSON.parse(userStates[userKey]);
      if (userData.expiresAt <= Date.now()) {
        await redis.hdel('userStates', userKey);
        isUpdateRedis = true;
      }
    }

    if (isUpdateRedis) {
      transmit.broadcast('users/state', {
        message: 'update user connected',
      })
    }

    const users = Object.values(userStates).map((userState) => JSON.parse(userState))

    return response.send(users.filter(u => u.expiresAt > Date.now()))
  }

  async createEmailToken({ request, auth, response }: HttpContext) {
    const payload = auth.use('jwt').payload
    const data = await request.validateUsing(emailUpdateValidator);
    if (payload?.sub == null) return response.abort({ message: "Can't update email" })
    const token = await this.userService.storeEmailChangeToken(payload.sub, payload.email, data.email)
    return response.send({ token: token })
  }

  async confirmEmailUpdate({ auth, bouncer, request }: HttpContext) {
    const payload = auth.use('jwt').payload
    const data = await request.validateUsing(confirmEmailUpdateValidator);
    const emailChangeToken = await this.userService.getEmailChangeToken(data.token)
    await bouncer.with(UserPolicy).authorize('updateEmail' as never, payload?.sub, emailChangeToken.user_id)
    return this.userService.updateEmail(emailChangeToken.user_id, emailChangeToken.new_email)
  }
}
