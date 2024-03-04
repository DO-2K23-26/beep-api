import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const MessageController = () => import('#apps/messages/controllers/messages_controller')

router
  .group(() => {
    router.get('/', [MessageController, 'index'])
    router.post('/', [MessageController, 'store'])
    router.get('/:id', [MessageController, 'show'])
    router.put('/:id', [MessageController, 'update'])
    router.delete('/:id', [MessageController, 'destroy'])
  })
  .prefix('/messages')
  .use(middleware.auth())
