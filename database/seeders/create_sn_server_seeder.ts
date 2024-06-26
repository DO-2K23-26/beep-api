import Server from '#apps/servers/models/server'
import { generateSnowflake } from '#apps/shared/services/snowflake'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const servers = await Server.query().whereNull('serial_number')

    for (const server of servers) {
      const sn = generateSnowflake()
      await server.merge({ serialNumber: sn }).save()
    }
  }
}
