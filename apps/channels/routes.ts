import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const MessagesChannelsController = () => import('./controllers/messages_channels_controller.js')

const ChannelsController = () => import('#apps/channels/controllers/channels_controller')

router
  .group(() => {
    router.group(() => {
      router.post('/:id/join', [ChannelsController, 'join'])
      router.post('/:id/leave', [ChannelsController, 'leave'])
    })
    router
      .group(() => {
        router.post('/', [MessagesChannelsController, 'store'])
        router.get('/', [MessagesChannelsController, 'index'])
        router.delete('/:messageId', [MessagesChannelsController, 'destroy'])
        router.get('/:messageId', [MessagesChannelsController, 'show'])
        router.patch('/:messageId', [MessagesChannelsController, 'update'])
      })
      .prefix('/:channelId/messages')
  })
  .prefix('channels')
  .use(middleware.auth())
