import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import FriendsController from '#apps/friends/controllers/friends_controller'

const UsersControllerV0 = () => import('#apps/users/controllers/users_v0_controller')
const UsersController = () => import('#apps/users/controllers/users_controller')
const UserServersController = () => import('#apps/users/controllers/user_servers_controller')

router
  .group(() => {
    router
      .group(() => {
        router.get('/', [UsersController, 'index'])

        router
          .group(() => {
            router.get('/servers', [UserServersController, 'index'])
          })
          .prefix('/@me')
      })
      .prefix('/v1/users')

    router
      .group(() => {
        router.get('', [UsersControllerV0, 'index'])
        router.post('/connect', [UsersControllerV0, 'connectUser'])
        router.post('/disconnect', [UsersControllerV0, 'disconnectUser'])
        router.get('/onlines', [UsersControllerV0, 'onlines'])
        router.get('/display', [UsersControllerV0, 'all'])
        router
          .group(() => {
            router
              .group(() => {
                router.post('', [UsersControllerV0, 'createEmailToken'])
                router.put('', [UsersControllerV0, 'confirmEmailUpdate'])
              })
              .prefix('/email')
            router.get('', [UsersControllerV0, 'findMe'])
            router.put('', [UsersControllerV0, 'update'])
            router.get('friends', [FriendsController, 'index'])
          })
          .prefix('/@me')
        router.get('/:userId', [UsersControllerV0, 'show'])
      })
      .prefix('/users')
  })
  .use(middleware.auth())

// router.post('/register', [UsersController, 'register'])
