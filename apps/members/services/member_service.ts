import { MemberServiceContract } from "#apps/members/contracts/member_service"
import { CreateMembersSchema } from "#apps/members/validators/member"
import Member from "#apps/members/models/member"
import Server from "#apps/servers/models/server"

export default class MemberService implements MemberServiceContract {

  async create(payload: CreateMembersSchema, serverId: string, userId: string): Promise<Member> {
    return Member.create({
      nickname: payload.nick,
      serverId,
      userId
    })
  }

  async getServersByUserId(userId: string): Promise<Server[]> {

    return Server
      .query()
      .whereHas('members', (builder) => {
        builder.where('user_id', userId)
      })
  }

  addMemberRole(): Promise<void> {
    throw new Error("Method not implemented.")
  }

  findAllByServerId(serverId: string): Promise<void> {
    console.log(serverId)

    throw new Error("Method not implemented.")
  }

  removeMemberRole(): Promise<void> {
    throw new Error("Method not implemented.")
  }

  removeServerMember(): Promise<void> {
    throw new Error("Method not implemented.")
  }
}
