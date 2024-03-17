import { type HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import UserService from '#apps/users/services/user_service'
import UserPolicy from '#apps/users/policies/user_policy'
import AuthenticationService from '#apps/authentication/services/authentication_service'
import redis from '@adonisjs/redis/services/main'
import transmit from "@adonisjs/transmit/services/main";

@inject()
export default class UsersController {
  constructor(protected userService: UserService, protected authenticationService: AuthenticationService) {}

  async index({ response, bouncer }: HttpContext) {
    await bouncer.with(UserPolicy).authorize('view' as never)
    const users = await this.userService.findAll()

    return response.send(users)
  }

  async connectUser({ response, auth }: HttpContext) {
    const payload = auth.use('jwt').payload

    await redis.hset('userStates', payload.sub, JSON.stringify({
      id: payload.sub,
      username: payload.username
    }));

    transmit.broadcast('users/state', {
      message: 'new user connected'
    })

    return response.send({
      message: 'User connected'
    })
  }

  async disconnectUser({ response, auth }: HttpContext) {
    const payload = auth.use('jwt').payload

    await redis.hdel('userStates', payload.sub)

    transmit.broadcast('users/state', {
      message: 'new user disconnected'
    })

    return response.send({
      message: 'User disconnected'
    })
  }

  async onlines({ response }: HttpContext) {
    const userStates = await redis.hgetall('userStates');
    const users = Object.values(userStates).map((userState) => JSON.parse(userState));

    return response.send(users)
  }
}
