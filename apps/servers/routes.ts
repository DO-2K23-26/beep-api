import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ServerController = () => import('#apps/servers/controllers/server_controller')
const ServerChannelsController = () =>
  import('#apps/servers/controllers/server_channels_controller')
router
  .group(() => {
    router.get('/', [ServerController, 'index'])
    router.post('/', [ServerController, 'store'])
    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [ServerChannelsController, 'findByServerId'])
            router.post('/', [ServerChannelsController, 'createChannel'])
            router.get('/:channelId', [ServerChannelsController, 'findByChannelId'])
            router.get('/:channelId/streaming/users', [ServerChannelsController, 'streamingUsers'])
          })
          .prefix('channels')
        router.get('/', [ServerController, 'show'])
        router.get('/owner', [ServerController, 'getOwner'])
        router.post('/join', [ServerController, 'join'])
        router.get('/users', [ServerController, 'getAllUsers'])
        // router.get('/timeout/:user_id', [ServerController, 'timeout'])
      })
      .prefix('/:serverId')
  })
  .prefix('servers')
  .use(middleware.auth())
