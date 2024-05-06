import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from "#apps/users/models/user";

export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        email: 'baptiste.bronsin@outlook.com',
        password: 'Baptiste01!',
        username: 'baraly',
        firstName: 'Baptiste',
        lastName: 'Bronsin',
      },
      {
        email: 's.theoulle@outlook.fr',
        password: 'S@raht073@beep',
        username: 'lightsrh',
        firstName: 'Sarah',
        lastName: 'Theoulle',
      },
      {
        email: 'pro.nathaelbonnal@gmail.com',
        password: 'caca',
        username: 'nathaelb',
        firstName: 'Nathael',
        lastName: 'Bonnal',
      },
      {
        email: 'isalyne.llinares@gmail.com',
        password: 'isalyne ',
        username: 'isa',
        firstName: 'isalyne ',
        lastName: 'llinares',
      }
    ])
  }
}
