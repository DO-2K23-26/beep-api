import { Payload } from '#apps/authentication/contracts/payload'
import InvitationService from '#apps/invitations/services/invitation_service'
import { createInvitationValidator } from '#apps/invitations/validators/invitation'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ServerInvitationsController {
  constructor(private invitationService: InvitationService) {}

  async createInvitation({ auth, request, params }: HttpContext) {
    const receivedInvitation = await request.validateUsing(createInvitationValidator)
    const userPayload = auth.use('jwt').payload as Payload
    const serverId = params.serverId
    const invitation = await this.invitationService.create(
      receivedInvitation,
      userPayload.sub,
      serverId,
      'usable'
    )
    return invitation
  }

  // [DEPRECATED]
  // Use ServerController.joinPrivate instead
  async joinPrivate({ auth, params }: HttpContext) {
    const userPayload = auth.use('jwt').payload as Payload
    const invitationId = params.invitationId
    const invitation = await this.invitationService.joinPrivate(invitationId, userPayload.sub)
    return invitation
  }

  // [DEPRECATED]
  // Use ServerController.joinPublic instead
  async joinPublic({ auth, response, params }: HttpContext) {
    const userPayload = auth.use('jwt').payload as Payload
    const serverId = params.serverId
    await this.invitationService.joinPublic(userPayload.sub.toString(), serverId)
    return response.send({ message: 'User joined successfully' })
  }
}
