import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import InvitationsController from '#apps/invitations/controllers/invitations_controller'

router
  .group(() => {
    router.post('/', [InvitationsController, 'create'])
    router.patch('/:invitationId', [InvitationsController, 'answerInvitation'])
  })
  .prefix('invitations')
  .use(middleware.auth())
