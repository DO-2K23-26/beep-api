import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ChannelsController = () => import('#apps/channels/controllers/channels_controller')

router
  .group(() => {
    router.get('/', [ChannelsController, 'index'])
    router.get('/:id', [ChannelsController, 'show'])
    router.post('/', [ChannelsController, 'store'])
    router.patch('/', [ChannelsController, 'update'])
    router.delete('/:id', [ChannelsController, 'destroy'])
    router.group(() => {
      router.post('/:id/join', [ChannelsController, 'join'])
      router.post('/:id/leave', [ChannelsController, 'leave'])
    })
  })
  .prefix('channels')
  .use(middleware.auth())
