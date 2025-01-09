/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import { Payload } from '#apps/authentication/contracts/payload'
import { HttpLimiter } from '@adonisjs/limiter'
import limiter from '@adonisjs/limiter/services/main'
import { LimiterManagerStoreFactory } from '@adonisjs/limiter/types'

type LimiterType = HttpLimiter<{ redis: LimiterManagerStoreFactory }>

export const throttleSignUp = limiter.define('signup', (ctx) => {
  /**
   * Allow guest users to make 3 requests by ip address
   */
  return limiter
    .allowRequests(3)
    .every('1 minute')
    .usingKey(`ip_${ctx.request.ip()}`) as LimiterType
})

export const throttleCreation = limiter.define('creation', (ctx) => {
  /**
   * Allow authenticated users to make 3 requests by user id
   */
  if (!ctx.auth.user) {
    return limiter.allowRequests(0) as LimiterType
  }

  return limiter
    .allowRequests(3)
    .every('1 minute')
    .usingKey(`user_${(ctx.auth.user as Payload).sub}`) as LimiterType
})

export const throttleMessage = limiter.define('message', (ctx) => {
  /**
   * Allow authenticated users to make 10 requests by user id
   */
  if (!ctx.auth.user) {
    return limiter.allowRequests(0) as LimiterType
  }

  return limiter
    .allowRequests(10)
    .every('10 seconds')
    .usingKey(`user_${(ctx.auth.user as Payload).sub}`) as LimiterType
})
