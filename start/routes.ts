/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router
  .get('/', async ({ auth }) => {
    const payload = auth.use('jwt').payload
    return payload
  })
  .use(middleware.auth())
