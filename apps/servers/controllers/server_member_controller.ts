import { inject } from '@adonisjs/core'
import MemberService from '#apps/members/services/member_service'
import { HttpContext } from '@adonisjs/core/http'
import { updateMemberValidator } from '#apps/members/validators/member'
import { JwtPayload } from 'jsonwebtoken'

@inject()
export default class ServerMembersController {
  constructor(protected memberService: MemberService) {}
  async udpate({ request, auth }: HttpContext) {
    const user = auth.user as JwtPayload
    const data = await request.validateUsing(updateMemberValidator)
    return this.memberService.update(user.sub!, data)
  }
}
