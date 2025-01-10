import WrongChannelTypeException from '#apps/channels/exceptions/wrong_channel_type'
import { ChannelType } from '#apps/channels/models/channel_type'
import ChannelService from '#apps/channels/services/channel_service'
import ExpiredInvitationException from '#apps/invitations/exceptions/expired_invitation_exception'
import PrivateServerException from '#apps/invitations/exceptions/private_server_exception'
import UnusableInvitationException from '#apps/invitations/exceptions/unusable_invitation_exception'
import WrongInvitationFormatException from '#apps/invitations/exceptions/wrong_invitation_format_exception'
import { InvitationStatus } from '#apps/invitations/models/status'
import { InvitationType } from '#apps/invitations/models/type'
import InvitationService from '#apps/invitations/services/invitation_service'
import UserAlreadyMember from '#apps/members/exceptions/user_already_member_exception'
import Member from '#apps/members/models/member'
import RoleService from '#apps/roles/services/role_service'
import ServerService from '#apps/servers/services/server_service'
import { Permissions } from '#apps/shared/enums/permissions'
import UserService from '#apps/users/services/user_service'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'

@inject()
export default class MemberService {
  constructor(
    protected userService: UserService,
    protected serverService: ServerService,
    protected invitationService: InvitationService,
    protected channelService: ChannelService,
    protected roleService: RoleService,
  ) { }

  async create(serverId: string, userId: string): Promise<Member> {
    const user = await this.userService.findById(userId)
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

  async findFrom(memberIds: string[]) {
    return Member.query().whereIn('id', memberIds)
  }

  async findById(memberId: string) {
    return Member.findOrFail(memberId)
  }
  async createFromInvitation(invitationId: string, userId: string): Promise<Member> {
    const invitation = await this.invitationService.findById(invitationId)
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
    const server = await this.serverService.findById(serverId)
    if (server.visibility === 'private') {
      throw new PrivateServerException('Server is private', {
        status: 403,
        code: 'E_PRIVATE_SERVER',
      })
    }
    return this.create(server.id, userId)
  }

  async findAllByServerId(serverId: string): Promise<Member[]> {
    const server = await this.serverService.findById(serverId)
    await server.load('members', (query) => {
      query.preload('user')
    })

    return server.members
  }

  async getPermissionsFromChannel(userId: string, channelId: string): Promise<number> {
    const channel = await this.channelService.findByIdOrFail(channelId)

    if (channel.serverId === null || channel.type !== ChannelType.TEXT_SERVER)
      throw new WrongChannelTypeException('Wrong channel type', {
        status: 400,
        code: 'E_WRONG_CHANNEL_TYPE',
      })
    return this.getPermissions(userId, channel.serverId)
  }

  async getPermissions(userId: string, serverId: string) {
    const member = await Member.query()
      .where('user_id', userId)
      .where('server_id', serverId)
      .preload('roles')
      .firstOrFail()

    const isOwner = (await this.serverService.findOwner(serverId)) == userId
    let permissions: number = 0
    if (isOwner) permissions = Permissions.ADMINISTRATOR
    const role = await this.roleService.findById(serverId)
    permissions |= role.permissions

    member.roles.forEach((r) => {
      permissions |= r.permissions
    })
    return permissions
  }

  async findFromNickname(serverId: string, nickname: string): Promise<Member[]> {
    const server = await this.serverService.findById(serverId)
    await server.load('members', (query) => {
      query.whereILike('nickname', `${nickname}%`).preload('user')
    })
    return server.members
  }

  async update(id: string, member: Partial<Member>): Promise<Member> {
    const updatedMember = await Member.findOrFail(id)
    await updatedMember.merge(member).save()
    return updatedMember
  }
}
