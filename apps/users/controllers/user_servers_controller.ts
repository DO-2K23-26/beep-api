import { inject } from "@adonisjs/core"
import { HttpContext } from "@adonisjs/core/http"
import MemberService from "#apps/members/services/member_service"
import { JwtPayloadContract } from "#apps/authentication/guards/jwt_guard"

@inject()
export default class UserServersController {
  constructor(
    protected memberService: MemberService
  ) { }

  async index({ auth }: HttpContext) {
    const id = (auth.user as JwtPayloadContract).sub!
    return this.memberService.getServersByUserId(id)
  }
}
