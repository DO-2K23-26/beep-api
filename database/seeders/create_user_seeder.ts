import Member from '#apps/members/models/member'
import Server from '#apps/servers/models/server'
import User from '#apps/users/models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    const user = await User.create({
      email: 'pro.nathaelbonnal@gmail.com',
      firstName: 'Nathael',
      lastName: 'Bonnal',
      password: 'nathael',
      username: 'nathael',
      profilePicture: 'https://avatars.githubusercontent.com/u/1016591',
      verifiedAt: DateTime.now(),
    })

    const server = await Server.create({
      name: 'Test[01]',
      ownerId: user.id,
    })

    await Server.create({
      name: 'My second server',
      //ownerId: user.id,
    })

    await Member.create({
      userId: user.id,
      serverId: server.id,
      nickname: user.username,
    })
  }
}
