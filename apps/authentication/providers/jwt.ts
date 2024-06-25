import { HttpContext } from '@adonisjs/core/http'
import { JwtGuard, JwtGuardOptions } from '#apps/authentication/guards/jwt_guard'
import env from '#start/env'

export function jwtGuard<UserProvider>(
  config: JwtGuardOptions & {
    provider: {
      model: () => UserProvider
      tokens: string
      uids: string[]
    }
  }
) {
  return {
    async resolver() {
      console.log(config.provider)
      const provider = config.provider

      const options: JwtGuardOptions = {
        secret: env.get('APP_KEY'),
      }
      return (ctx: HttpContext) => {
        return new JwtGuard(ctx, provider, options)
      }
    },
  }
}
