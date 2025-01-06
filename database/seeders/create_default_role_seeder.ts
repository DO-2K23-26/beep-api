import Server from '#apps/servers/models/server'
import { Permissions } from '#apps/shared/enums/permissions'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const servers = await Server.query()
    await Promise.all(
      servers.map(async (server) => {
        await server.related('roles').firstOrCreate(
          { id: server.id },
          {
            id: server.id,
            name: 'BasicMember',
            permissions:
              Permissions.VIEW_CHANNELS | Permissions.SEND_MESSAGES | Permissions.ATTACH_FILES,
          }
        )
      })
    )
  }
}
