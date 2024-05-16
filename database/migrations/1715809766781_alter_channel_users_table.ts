import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channel_users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // TODO delete this table
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
    })
  }
}
