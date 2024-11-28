import ExpiredInvitationException from '#apps/invitations/exceptions/expired_invitation_exception'
import PrivateServerException from '#apps/invitations/exceptions/private_server_exception'
import UnusableInvitationException from '#apps/invitations/exceptions/unusable_invitation_exception'
import WrongInvitationFormatException from '#apps/invitations/exceptions/wrong_invitation_format_exception'
import Invitation from '#apps/invitations/models/invitation'
import { InvitationStatus } from '#apps/invitations/models/status'
import { InvitationType } from '#apps/invitations/models/type'
import { MemberServiceContract } from '#apps/members/contracts/member_service'
import UserAlreadyMember from '#apps/members/exceptions/user_already_member_exception'
import Member from '#apps/members/models/member'
import ServerNotFoundException from '#apps/servers/exceptions/server_not_found_exception'
import Server from '#apps/servers/models/server'
import UserNotFoundException from '#apps/users/exceptions/user_not_found_exception'
import User from '#apps/users/models/user'
import { DateTime } from 'luxon'
export default class MemberService implements MemberServiceContract {
  async create(serverId: string, userId: string): Promise<Member> {
    const user = await User.findOrFail(userId).catch(() => {
      throw new UserNotFoundException('User not found', { status: 404, code: 'E_USER_NOT_FOUND' })
    })

    const member = await Member.create({
      nickname: user.username,
      serverId,
      userId,
    }).catch(() => {
      throw new UserAlreadyMember('This user is already in the server', {
        status: 400,
        code: 'E_USER_ALREADY_MEMBER',
      })
    })
    return member
  }

  async getServersByUserId(userId: string): Promise<Server[]> {
    return Server.query().whereHas('members', (builder) => {
      builder.where('user_id', userId)
    })
  }

  async createFromInvitation(invitationId: string, userId: string): Promise<Member> {
    const invitation = await Invitation.findByOrFail('id', invitationId).catch(() => {
      throw new WrongInvitationFormatException('Invitation not found', {
        status: 404,
        code: 'E_INVITATION_NOT_FOUND',
      })
    })
    if (invitation.status !== InvitationStatus.Pending && invitation.status !== null) {
      throw new UnusableInvitationException('Invitation is not usable', {
        status: 400,
        code: 'E_UNUSABLE_INVITATION',
      })
    }
    if (invitation.expiration < DateTime.now()) {
      throw new ExpiredInvitationException('Invitation is expired', {
        status: 400,
        code: 'E_EXPIRED_INVITATION',
      })
    }
    if (invitation.serverId === null || invitation.type !== InvitationType.SERVER) {
      throw new WrongInvitationFormatException('Wrong invitation format', {
        status: 400,
        code: 'E_WRONG_INVITATION_FORMAT',
      })
    }
    const member = this.create(invitation.serverId, userId)
    if (invitation.status !== null) {
      invitation.status = InvitationStatus.Accepted
      await invitation.save()
    }
    return member
  }

  async createForServer(userId: string, serverId: string): Promise<Member> {
    const server = await Server.findOrFail(serverId).catch(() => {
      throw new ServerNotFoundException('Server not found', {
        status: 404,
        code: 'E_ROW_NOT_FOUND',
      })
    })
    if (server.visibility === 'private') {
      throw new PrivateServerException('Server is private', {
        status: 403,
        code: 'E_PRIVATE_SERVER',
      })
    }
    return this.create(server.id, userId)
  }

  getMemberByUserIdAndServerId(userId: string, serverId: string): Promise<Member> {
    return Member.query().where('user_id', userId).where('server_id', serverId).firstOrFail()
  }

  addMemberRole(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  findAllByServerId(serverId: string): Promise<Member[]> {
    return Member.query().where('server_id', serverId).paginate(1, 1000)
  }

  removeMemberRole(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  removeServerMember(): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
