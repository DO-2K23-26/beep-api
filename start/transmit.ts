import transmit from '@adonisjs/transmit/services/main'
import type { HttpContext } from '@adonisjs/core/http'

transmit.authorize<{ token: string }>('qr-code/:token', (ctx: HttpContext, { token }) => {
  return token != ''
})
