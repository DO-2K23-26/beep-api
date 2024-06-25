import router from '@adonisjs/core/services/router'
import { middleware } from "#start/kernel";

const UsersController = () => import("#apps/users/controllers/users_controller")

router.group(() => {
  router.get('', [UsersController, 'index'])
  router.get('/:userId', [UsersController, 'show'])
  router.post('/connect', [UsersController, 'connectUser'])
  router.post('/disconnect', [UsersController, 'disconnectUser'])
  router.get('/onlines', [UsersController, 'onlines'])
  router.get('/display', [UsersController, 'all'])
  router.group(() => {
    router.group(() => {
      router.post('', [UsersController, 'createEmailToken'])
      router.put('', [UsersController, 'confirmEmailUpdate'])
    }).prefix('/email')
    router.get('',[UsersController, 'findMe'])
    router.put('', [UsersController, 'update'])
  }).prefix('/@me')
}).prefix('/users')
  .use(middleware.auth())

// router.post('/register', [UsersController, 'register'])
