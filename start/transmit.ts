import transmit from '@adonisjs/transmit/services/main'
import type { HttpContext } from '@adonisjs/core/http'
import redis from '@adonisjs/redis/services/main'

transmit.authorize<{ token: string }>('qr-code/:token', async (_ctx: HttpContext, { token }) => {
  //return false
  try {
    const state = await redis.get(`qr-code:${token}`)
    if (state !== 'generated') {
      return false
    }
    await redis.set(`qr-code:${token}`, 'pending', 'EX', 300)
    return true
  } catch {
    return false
  }
})
