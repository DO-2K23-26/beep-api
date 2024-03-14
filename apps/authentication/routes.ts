import router from '@adonisjs/core/services/router'

const AuthenticationController = () =>
  import('#apps/authentication/controllers/authentication_controller')

router
  .group(() => {
    router.post('/login', [AuthenticationController, 'login'])
    router.post('/register', [AuthenticationController, 'register'])
    router.post('/verify', [AuthenticationController, 'verifyEmail'])

    router.post('/refresh', [AuthenticationController, 'refresh'])
    router.get('/allLoggedUsers', [AuthenticationController, 'getAllLoggedUsers'])
  })
  .prefix('authentication')
