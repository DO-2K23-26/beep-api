const StoragesController = () => import('#apps/storage/controllers/storages_controller')
import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const ServerController = () => import('#apps/servers/controllers/server_controller')
const ServerChannelsController = () =>
  import('#apps/servers/controllers/server_channels_controller')
const ServerInvitationsController = () =>
  import('#apps/servers/controllers/server_invitations_controller')

const ServerMembersController = () => import('#apps/servers/controllers/server_members_controller')

router
  .group(() => {
    router
      .group(() => {
        router
          .group(() => {
            router.post('/join', [ServerMembersController, 'joinPublic'])
            router.get('/members', [ServerMembersController, 'index'])
            router.get('/members/:userId', [ServerMembersController, 'show'])
          })
          .prefix('/:serverId')
        router.post('/join/:invitationId', [ServerMembersController, 'joinPrivate'])
      })
      .prefix('/v1/servers')
  })
  .use(middleware.auth())

router
  .group(() => {
    router
      .group(() => {
        router.get('/', [ServerController, 'index'])
        router.get('/discover', [ServerController, 'discover'])
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
                router.delete('/:channelId', [ServerChannelsController, 'deleteChannel'])
                router.get('/:channelId', [ServerChannelsController, 'findByChannelId'])
                router
                  .post('/join', [ServerChannelsController, 'joinChannel'])
                  .prefix('/:channelId')
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
            router
              .group(() => {
                router.post('/', [ServerInvitationsController, 'createInvitation'])
              })
              .prefix('/invitation')
          })
          .prefix('/:serverId')
      })
      .prefix('servers')
  })

  .use(middleware.auth())
