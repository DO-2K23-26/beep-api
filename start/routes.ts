/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import transmit from '@adonisjs/transmit/services/main'
import swagger from '#config/swagger'
import AutoSwagger from 'adonis-autoswagger'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'

// returns swagger in YAML
router.get('/swagger', async () => {
  return AutoSwagger.default.docs(router.toJSON(), swagger)
})

router.get('/docs', async () => {
  return AutoSwagger.default.scalar('/swagger')
})

transmit.registerRoutes()

transmit.authorize<{ id: string }>('notifications/users/:id', (ctx: HttpContext, { id }) => {
  return (ctx.auth.user as JwtPayload).sub === id
})
