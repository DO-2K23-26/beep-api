import Channel from '#apps/channels/models/channel'
import { generateSnowflake } from '#apps/shared/services/snowflake'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const channels = await Channel.query().whereNull('serial_number')

    for (const channel of channels) {
      const sn = generateSnowflake()
      await channel.merge({ serialNumber: sn }).save()
    }
  }
}
