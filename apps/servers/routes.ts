import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ServerController = () => import('#apps/servers/controllers/server_controller')
const ServerChannelsController = () =>
  import('#apps/servers/controllers/server_channels_controller')
router
  .group(() => {
    router.get('/', [ServerController, 'index'])
    router.post('/', [ServerController, 'store'])
    router.post('/leave', [ServerChannelsController, 'leaveChannel']).prefix('channels')
    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [ServerChannelsController, 'findByServerId'])
            router.post('/', [ServerChannelsController, 'createChannel'])
            router.get('/:channelId', [ServerChannelsController, 'findByChannelId'])
            router.post('/join', [ServerChannelsController, 'joinChannel']).prefix('/:channelId')
          })
          .prefix('channels')
        router.get('/', [ServerController, 'show'])
        router.get('/owner', [ServerController, 'getOwner'])
        router.post('/join', [ServerController, 'join'])
        router.get('/users', [ServerController, 'getAllUsers'])
        router.get('/streaming/users', [ServerChannelsController, 'streamingUsers'])
        // router.get('/timeout/:user_id', [ServerController, 'timeout'])
      })
      .prefix('/:serverId')
  })
  .prefix('servers')
  .use(middleware.auth())
