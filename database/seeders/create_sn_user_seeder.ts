import { generateSnowflake } from '#apps/shared/services/snowflake'
import User from '#apps/users/models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  async run() {
    const users = await User.query().whereNull('serial_number')

    for (const user of users) {
      const sn = generateSnowflake()
      await user.merge({ serialNumber: sn }).save()
    }
  }
}
