import { DateTime } from 'luxon'
import Invitation from '../models/invitation.js'
import { CreateInvitationsSchema } from '../validators/invitation.js'
import Server from '#apps/servers/models/server'
import ExpiredInvitationException from '#exceptions/expired_invitation_exception'
import UnusableInvitationException from '#exceptions/unusable_invitation_exception'
import PrivateServerException from '#exceptions/private_server_exception'

export default class InvitationService {
  /**
   * Create a new invitation.
   */
  async create(
    { isUnique, expiration }: CreateInvitationsSchema,
    creatorId: string,
    serverId: string,
    state: 'usable'
  ): Promise<Invitation> {
    const invitation = await Invitation.create({
      isUnique: isUnique,
      expiration: DateTime.fromJSDate(expiration),
      creatorId: creatorId,
      serverId: serverId,
      state: state,
    })

    return invitation.save()
  }

  async joinPrivate(invitationId: string, userId: string): Promise<Invitation> {
    const invitation = await Invitation.findOrFail(invitationId)

    if (invitation.expiration < DateTime.now()) {
      throw new ExpiredInvitationException('You are not authorized', {
        status: 403,
        code: 'E_UNAUTHORIZED',
      })
    }

    if (invitation.state === 'unusable') {
      throw new UnusableInvitationException('Unusable invitation', {
        status: 400,
        code: 'E_UNUSABLEINVITATION',
      })
    }

    if (invitation.isUnique) {
      invitation.state = 'unusable'
    }

    const server = await Server.findOrFail(invitation.serverId)

    const existingUser = await server.related('users').query().where('user_id', userId).first()
    if (!existingUser) {
      await server.related('users').attach([userId])
    }

    return invitation.save()
  }

  async joinPublic(userId: string, serverId: string): Promise<Server> {
    const server = await Server.findOrFail(serverId)

    if (server.visibility === 'private') {
      throw new PrivateServerException('Server is private', {
        status: 403,
        code: 'E_PRIVATESERVER',
      })
    }

    await server.related('users').attach([userId])
    return server
  }
}
