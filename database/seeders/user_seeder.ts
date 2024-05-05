import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#apps/users/models/user'

export default class extends BaseSeeder {
  async run() {
    await User.create({
      email: 'baptiste.bronsin@outlook.com',
      password: 'Baptiste01!',
      username: 'baraly',
      //@ts-ignore
      first_name: 'Baptiste',
      last_name: 'Bronsin',
    })
  }
}
