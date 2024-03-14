import { type HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import UserService from '#apps/users/services/user_service'
import UserPolicy from '#apps/users/policies/user_policy'
import AuthenticationService from '#apps/authentication/services/authentication_service'
import User from '../models/user.js'
import redis from '@adonisjs/redis/services/main'

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
    if (!(payload && typeof payload.sub === 'string')) {
      return { error: 'User not found' }
    }

    const user = await User.query()
      .where('id', payload.sub as string)
      .firstOrFail()

    await redis.hset('userStates', user.id, JSON.stringify({ userId: user.id, userName: user.username }));

    return response.status(200).send({ message: 'User connected' });
  };

  async disconnectUser({ response, auth }: HttpContext) {
    const payload = auth.use('jwt').payload
    if (!(payload && typeof payload.sub === 'string')) {
      return { error: 'User not found' }
    }

    const user = await User.query()
      .where('id', payload.sub as string)
      .firstOrFail()

    await redis.hdel('userStates', user.id);

    return response.status(200).send({ message: 'User disconnected' });
  };

  async onlines({ response }: HttpContext) {
    const userStates = await redis.hgetall('userStates');
    const users = Object.values(userStates).map((userState) => JSON.parse(userState));

    return response.send(users);
  }


  // async register({ request, response }: HttpContext) {
  //   const data = request.only(['email', 'password'])
  //   const user = await this.userService.create(data)

  //   return response.send(user)
  // }
}
