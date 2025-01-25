import InvalidPermissionsMaskException from '#apps/roles/exceptions/invalid_permissions_mask_exception'
import Role from '#apps/roles/models/role'
import { CreateRoleSchema, UpdateRoleSchema } from '#apps/roles/validators/role'
import PermissionsService from '#apps/shared/services/permissions/permissions_service'
import Server from '#apps/servers/models/server'
import { inject } from '@adonisjs/core'
import { BasePolicy } from '@adonisjs/bouncer'
import Member from '#apps/members/models/member'
import MemberService from '#apps/members/services/member_service'
import MemberNotInServerException from '#apps/members/exceptions/member_not_in_server_exception'
import WrongChannelTypeException from '#apps/channels/exceptions/wrong_channel_type'
import { ChannelType } from '#apps/channels/models/channel_type'
import ChannelService from '#apps/channels/services/channel_service'

@inject()
export default class RoleService extends BasePolicy {
  constructor(
    protected permissionsService: PermissionsService,
    protected memberService: MemberService,
    protected channelService: ChannelService
  ) {
    super()
  }

  async findById(roleId: string): Promise<Role> {
    return Role.findOrFail(roleId)
  }

  async findAllByServer(serverId: string): Promise<Role[]> {
    const server = await Server.findOrFail(serverId)
    await server.load('roles')
    return server.roles
  }

  async create(newRole: CreateRoleSchema, serverId: string): Promise<Role> {
    const permissions = newRole.permissions
    // Check for permissions validity
    if (!this.permissionsService.isValidMask(permissions)) {
      throw new InvalidPermissionsMaskException('Invalid permissions mask', {
        status: 400,
        code: 'E_INVALID_PERMISSIONS_MASK',
      })
    }

    const role = await Role.create({
      name: newRole.name,
      permissions: permissions,
      serverId: serverId,
    })
    return role.save()
  }

  async update(id: string, payload: UpdateRoleSchema): Promise<Role> {
    // Check for permissions validity
    if (!this.permissionsService.isValidMask(payload.permissions)) {
      throw new InvalidPermissionsMaskException('Invalid permissions mask', {
        status: 400,
        code: 'E_INVALID_PERMISSIONS_MASK',
      })
    }

    const role = await Role.findOrFail(id)
    role.merge(payload)
    return role.save()
  }

  async deleteById(roleId: string): Promise<void> {
    const role: Role = await Role.findOrFail(roleId)
    await role.delete()
  }

  async assign(roleId: string, memberId: string): Promise<void> {
    const role = await Role.findOrFail(roleId)
    const member = await this.memberService.findById(memberId)
    if (member.serverId != role.serverId)
      throw new MemberNotInServerException('Member is not in the server', {
        code: 'E_MEMBER_NOT_IN_SERVER',
        status: 400,
      })
    await role.related('members').attach([memberId])
  }

  async unassign(roleId: string, memberId: string): Promise<void> {
    const role = await Role.findOrFail(roleId)
    await role.related('members').detach([memberId])
  }

  async findMembersByRoleId(roleId: string): Promise<Member[]> {
    const role = await Role.query().where('id', roleId).preload('members').firstOrFail()
    return role.members
  }

  async getMemberPermissionsFromChannel(userId: string, channelId: string): Promise<number> {
    const channel = await this.channelService.findByIdOrFail(channelId)

    if (channel.serverId === null || channel.type !== ChannelType.TEXT_SERVER)
      throw new WrongChannelTypeException('Wrong channel type', {
        status: 400,
        code: 'E_WRONG_CHANNEL_TYPE',
      })
    return this.getMemberPermissions(userId, channel.serverId)
  }

  async getMemberPermissions(userId: string, serverId: string) {
    const member = await Member.query()
      .where('user_id', userId)
      .where('server_id', serverId)
      .preload('roles')
      .firstOrFail()

    // Get the default role of the server
    const role = await Role.findOrFail(serverId)
    let permissions = role.permissions

    member.roles.forEach((r) => {
      permissions |= r.permissions
    })

    return permissions
  }

  async getAssignedMembers(roleId: string) {
    const role = await this.findById(roleId)
    await role.load('members')
    return role.members
  }
}
