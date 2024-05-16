import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Role from '#apps/users/models/role'

export default class extends BaseSeeder {
  async run() {
    await Role.create({
      label: 'Administrateur',
      power: 100,
    })

    await Role.create({
      label: 'Membre',
      power: 1,
    })
  }
}
