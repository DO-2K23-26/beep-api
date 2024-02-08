import {GuardConfigProvider} from "@adonisjs/auth/types"
import {HttpContext} from "@adonisjs/core/http"
import {JwtGuard, JwtGuardOptions} from "#apps/authentication/guards/jwt_guard"
import env from "#start/env"
import {ConfigProvider} from "@adonisjs/core/types";

export function jwtGuard<UserProvider>(
  config: JwtGuardOptions & {
    provider: ConfigProvider<UserProvider>
  }
): GuardConfigProvider<(ctx: HttpContext) => JwtGuard<UserProvider>> {
  return {
    async resolver() {
      console.log(config.provider)
      const provider = config.provider

      const options: JwtGuardOptions = {
        secret: env.get('APP_KEY')
      }
      return (ctx) => {
        return new JwtGuard(ctx, provider, options)
      }
    }
  }
}
