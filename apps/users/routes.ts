import router from '@adonisjs/core/services/router'
import {middleware} from "#start/kernel";

const UsersController = () => import("#apps/users/controllers/users_controller")

router.group(() => {
  router.get('', [UsersController, 'index'])
  router.post('/connect', [UsersController, 'connectUser'])
  router.post('/disconnect', [UsersController, 'disconnectUser'])
  router.get('/onlines', [UsersController, 'onlines'])
}).prefix('/users')
  .use(middleware.auth())

// router.post('/register', [UsersController, 'register'])
