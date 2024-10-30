import { MemberServiceContract } from '#apps/members/contracts/member_service'
import { CreateMembersSchema } from '#apps/members/validators/member'
import Member from '#apps/members/models/member'
import Server from '#apps/servers/models/server'
import PrivateServerException from '#exceptions/private_server_exception'
import User from '#apps/users/models/user'
import Invitation from '#apps/invitations/models/invitation'
import { DateTime } from 'luxon'
import ExpiredInvitationException from '#exceptions/expired_invitation_exception'
import UnusableInvitationException from '#exceptions/unusable_invitation_exception'
import UserAlreadyMember from '../exceptions/user_already_member_exception.js'
import ServerNotFoundException from '#apps/servers/exceptions/server_not_found_exception'
import UserNotFoundException from '#apps/users/exceptions/user_not_found_exception'

export default class MemberService implements MemberServiceContract {
  async create(payload: CreateMembersSchema, serverId: string, userId: string) {
    return Member.create({
      nickname: payload.nick,
      serverId,
      userId,
    }).catch(() => {
      throw new UserAlreadyMember('This user is already in the server', {
        status: 400,
        code: 'E_USERALREADYMEMBER',
      })
    })
  }

  async getServersByUserId(userId: string): Promise<Server[]> {
    return Server.query().whereHas('members', (builder) => {
      builder.where('user_id', userId)
    })
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

  async joinPrivateServer(invitationId: string, userId: string): Promise<Member> {
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

    const server = await Server.findOrFail(invitation.serverId).catch(() => {
      throw new ServerNotFoundException('Server not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })
    const user = await User.findOrFail(userId).catch(() => {
      throw new UserNotFoundException('User not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })

    const existingUser = await server.related('members').query().where('user_id', userId).first()
    if (!existingUser) {
      invitation.save()
      return this.create({ nick: user.username, roles: [] }, server.id, userId)
    } else {
      throw new UnusableInvitationException('User already in server', {
        status: 400,
        code: 'E_UNUSABLEINVITATION',
      })
    }
  }

  async joinPublicServer(userId: string, serverId: string): Promise<Member> {
    const server = await Server.findOrFail(serverId).catch(() => {
      throw new ServerNotFoundException('Server not found', {
        status: 404,
        code: 'E_ROWNOTFOUND',
      })
    })

    if (server.visibility === 'private') {
      throw new PrivateServerException('Server is private', {
        status: 403,
        code: 'E_PRIVATESERVER',
      })
    }
    const user = await User.findOrFail(userId).catch(() => {
      throw new UserNotFoundException()
    })
    return this.create({ nick: user.username, roles: [] }, server.id, userId)
  }
}
