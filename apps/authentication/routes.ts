import router from '@adonisjs/core/services/router'

const AuthenticationController = () => import('#apps/authentication/controllers/authentication_controller')

router.group(() => {
  router.post('/login', [AuthenticationController, 'login'])
  //router.post('/register', [AuthenticationController, 'register'])

  router.post('/refresh', [AuthenticationController, 'refresh'])
}).prefix('authentication')
