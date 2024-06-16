const StoragesController = () => import('#apps/storage/controllers/storages_controller')
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ServerController = () => import('#apps/servers/controllers/server_controller')
const ServerChannelsController = () =>
  import('#apps/servers/controllers/server_channels_controller')
const ServerInvitationsController = () =>
  import('#apps/servers/controllers/server_invitations_controller')

router
  .group(() => {
    router.get('/', [ServerController, 'index'])
    router.post('/', [ServerController, 'store'])
    router.post('/leave', [ServerChannelsController, 'leaveChannel']).prefix('channels')
    router.post('/join/:invitationId', [ServerInvitationsController, 'joinPrivate'])
    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [ServerChannelsController, 'findByServerId'])
            router.post('/', [ServerChannelsController, 'createChannel'])
            router.put('/:channelId', [ServerChannelsController, 'updateChannel'])
            router.get('/:channelId', [ServerChannelsController, 'findByChannelId'])
            router.post('/join', [ServerChannelsController, 'joinChannel']).prefix('/:channelId')
          })
          .prefix('channels')
        router
          .group(() => {
            router.get('/', [StoragesController, 'transmitBanner'])
            router.put('/', [ServerController, 'updateBanner'])
          })
          .prefix('banner')
        router
          .group(() => {
            router.get('/', [StoragesController, 'transmitPicture'])
            router.put('/', [ServerController, 'updatePicture'])
          })
          .prefix('picture')
        router.get('/', [ServerController, 'show'])
        router.patch('/', [ServerController, 'update'])
        router.get('/owner', [ServerController, 'getOwner'])
        router.get('/users', [ServerController, 'getAllUsers'])
        router.post('/join', [ServerInvitationsController, 'joinPublic'])
        router.get('/streaming/users', [ServerChannelsController, 'streamingUsers'])
        router.delete('/', [ServerController, 'destroy'])
        router.post('/mic', [ServerChannelsController, 'changeMutedStatus']).prefix('users')
        // router.get('/timeout/:user_id', [ServerController, 'timeout'])
        router
          .group(() => {
            router.post('/', [ServerInvitationsController, 'createInvitation'])
          })
          .prefix('/invitation')
      })
      .prefix('/:serverId')
  })
  .prefix('servers')
  .use(middleware.auth())
