import { type HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import UserService from '#apps/users/services/user_service'
import UserPolicy from '#apps/users/policies/user_policy'
import AuthenticationService from '#apps/authentication/services/authentication_service'
import redis from '@adonisjs/redis/services/main'
import transmit from '@adonisjs/transmit/services/main'

@inject()
export default class UsersController {
  constructor(
    protected userService: UserService,
    protected authenticationService: AuthenticationService
  ) {}

  async index({ response, bouncer }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('view' as never)
    const users = await this.userService.findAll()

    return response.send(users)
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
}
