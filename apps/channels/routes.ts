import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const MessagesChannelsController = () => import('./controllers/messages_channels_controller.js')
const AttachementsChannelController = () =>
  import('#apps/channels/controllers/attachments_channel_controller')

router
  .group(() => {
    router
      .group(() => {
        router.post('/', [MessagesChannelsController, 'store'])
        router.get('/', [MessagesChannelsController, 'index'])
        router.get('/pinned', [MessagesChannelsController, 'pinned'])
        router.patch('/:messageId/pin', [MessagesChannelsController, 'pin'])
        router.delete('/:messageId', [MessagesChannelsController, 'destroy'])
        router.get('/:messageId', [MessagesChannelsController, 'show'])
        router.patch('/:messageId', [MessagesChannelsController, 'update'])
        router.delete('/:messageId/find-and-delete', [MessagesChannelsController, 'findAndDelete'])
      })
      .prefix('/:channelId/messages')

    router
      .group(() => {
        router.get('/attachments', [AttachementsChannelController, 'index'])
      })
      .prefix('/:channelId')
  })
  .prefix('channels')
  .use(middleware.auth())
