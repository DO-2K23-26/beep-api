import User from '#apps/users/models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class extends BaseSeeder {
  static environment: string[] = ['development']
  async run() {
    // Write your database queries inside the run method
    const users = [
      {
        username: 'admin',
        email: 'admin@beep.com',
        password: 'admin',
        firstName: 'Admin',
        lastName: 'Beep',
        profilePicture: 'default_profile_picture.png',
      },
      {
        username: 'user',
        email: 'user@beep.com',
        password: 'user',
        firstName: 'User',
        lastName: 'Beep',
        profilePicture: 'default_profile_picture.png',
      },
    ]
    for (const userPayload of users) {
      const user = await User.findBy('email', userPayload.email)
      if (!user) {
        await User.create(userPayload)
      }
    }
  }
}
