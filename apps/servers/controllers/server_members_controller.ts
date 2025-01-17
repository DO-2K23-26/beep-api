import MemberService from '#apps/members/services/member_service'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import ServerMemberPolicy from '#apps/servers/policies/server_member_policy'
import ServerService from '#apps/servers/services/server_service'
import { Payload } from '#apps/authentication/contracts/payload'
import { updateNicknameMemberValidator } from '#apps/members/validators/member'

@inject()
export default class ServerMembersController {
  constructor(
    protected memberService: MemberService,
    protected serverService: ServerService
  ) {}

  async index({ params, bouncer }: HttpContext) {
    const { serverId } = params
    await bouncer.with(ServerMemberPolicy).authorize('view' as never, serverId)
    const members = await this.memberService.findAllByServerId(serverId)
    return members
  }

  async show({ params, bouncer }: HttpContext) {
    const { serverId, userId } = params
    const members = await this.memberService.findAllByServerId(serverId)
    await bouncer.with(ServerMemberPolicy).authorize('view' as never, members)
    return this.serverService.getMember(serverId, userId)
  }

  async showMe({ params, bouncer, auth }: HttpContext) {
    const { serverId } = params
    const user = auth.user as Payload
    const members = await this.memberService.findAllByServerId(serverId)
    await bouncer.with(ServerMemberPolicy).authorize('view' as never, members)
    return this.serverService.getMember(serverId, user.sub!)
  }

  async joinPublic({ auth, params, response }: HttpContext) {
    const userPayload = auth.user as Payload
    const member = await this.memberService.createForServer(userPayload.sub, params.serverId)
    return response.created(member)
  }

  async joinPrivate({ auth, params, response }: HttpContext) {
    const userPayload = auth.user as Payload
    const invitationId = params.invitationId
    const member = await this.memberService.createFromInvitation(invitationId, userPayload.sub)
    return response.created(member)
  }
  async updateNickname({ request, bouncer, params }: HttpContext) {
    const { serverId, memberId } = params
    await bouncer.with(ServerMemberPolicy).authorize('updateNickname' as never, serverId, memberId)
    const data = await request.validateUsing(updateNicknameMemberValidator)
    return this.memberService.update(memberId, data)
  }
}
