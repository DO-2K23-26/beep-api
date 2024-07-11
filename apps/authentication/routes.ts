import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthenticationController = () =>
  import('#apps/authentication/controllers/authentication_controller')

router
  .group(() => {
    router.post('/signin', [AuthenticationController, 'signin'])
    router.post('/signup', [AuthenticationController, 'signup'])
    router.post('/verify', [AuthenticationController, 'verifyEmail'])
    router.post('/refresh', [AuthenticationController, 'refresh'])

    router
      .group(() => {
        router.patch('/updatePassword', [AuthenticationController, 'updatePassword'])
        router.post('/send-email', [AuthenticationController, 'sendEmail'])
      })
      .use(middleware.auth())
  })
  .prefix('authentication')
