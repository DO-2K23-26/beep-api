import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'servers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable('icon')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('icon').notNullable()
    })
  }
}
