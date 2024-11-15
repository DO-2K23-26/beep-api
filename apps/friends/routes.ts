import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const FriendsController = () => import('#apps/friends/controllers/friends_controller')

router
  .group(() => {
    router.group(() => {
      router.delete('/:friendId', [FriendsController, 'destroy'])
      router.post('/:friendId', [FriendsController, 'store'])
    })
  })
  .prefix('friends')
  .use(middleware.auth())
