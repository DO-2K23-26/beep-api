import { BasePolicy } from '@adonisjs/bouncer'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { JwtPayload } from 'jsonwebtoken'
import Server from '#apps/servers/models/server'
import ServerNotFoundException from '#apps/servers/exceptions/server_not_found_exception'

@inject()
export default class ServerInvitationPolicy extends BasePolicy {
  constructor(protected ctx: HttpContext) {
    super()
  }

  async create(user: JwtPayload, serverId: number) {
    const server = await Server.findOrFail(serverId).catch(() => {
      throw new ServerNotFoundException('Server does not exist pouette/', {
        code: 'E_SERVER_NOT_FOUND',
        status: 404,
      })
    })

    await server.load('members')
    const member = server.members.find((member) => member.userId === user.sub)
    return member !== undefined
  }
}
