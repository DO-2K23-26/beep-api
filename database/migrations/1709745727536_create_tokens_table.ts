import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('token').notNullable()
      table.string('owner_id').references('id').inTable('users').notNullable()
      table.timestamp('created_at')
      table.timestamp('desactivated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}