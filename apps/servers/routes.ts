import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ServerController = () => import('#apps/servers/controllers/server_controller')
const ServerChannelsController = () =>
  import('#apps/servers/controllers/server_channels_controller')
router
  .group(() => {
    router.get('/', [ServerController, 'index'])
    router.get('/:serverId', [ServerController, 'show'])
    router.post('/', [ServerController, 'store'])
    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [ServerChannelsController, 'findByServerId'])
            router.post('/', [ServerChannelsController, 'createChannel'])
          })
          .prefix('channels')
        router.get('/owner', [ServerController, 'getOwner'])
        router.post('/join', [ServerController, 'join'])
        // router.get('/timeout/:user_id', [ServerController, 'timeout'])
      })
      .prefix('/:serverId')
  })
  .prefix('servers')
  .use(middleware.auth())
