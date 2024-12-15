import { HttpContext } from '@adonisjs/core/http'

export default class AuthExceptionMiddleware {
  public async handle(ctx: HttpContext, next: () => Promise<void>) {
    const publicRoutes = ['/webhook/trigger/:token']

    // Vérifiez si la route actuelle est publique
    if (
      publicRoutes.some((route) =>
        ctx.request.url().match(new RegExp(`^${route.replace(':token', '[^/]+')}$`))
      )
    ) {
      await next() // Skip auth middleware
      return
    }

    // Si la route n'est pas publique, appliquez l'authentification
    await ctx.auth.authenticate()

    await next()
  }
}
