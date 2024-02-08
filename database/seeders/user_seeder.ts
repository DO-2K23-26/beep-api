import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from "#apps/users/models/user";

export default class extends BaseSeeder {
  async run() {
    await User.create({
      email: 'pro.nathaelbonnal@gmail.com',
      password: 'nathael',
    })
  }
}
