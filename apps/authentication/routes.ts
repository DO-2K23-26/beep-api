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
    router.post('/reset-password', [AuthenticationController, 'sendResetPasswordEmail'])
    router.post('/verify-reset-password', [AuthenticationController, 'verifyResetPassword'])

    router
      .group(() => {
        router.patch('/password', [AuthenticationController, 'updatePassword'])
        router.post('/send-email', [AuthenticationController, 'sendEmail'])
      })
      .use(middleware.auth())
  })
  .prefix('authentication')
