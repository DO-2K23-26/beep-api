import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['webhookId'])

      table
        .string('webhookId')
        .references('id')
        .inTable('webhooks')
        .onDelete('RESTRICT')
        .nullable()
        .alter()
    })
  }

  // async down() {
  //   this.schema.dropTable(this.tableName)
  // }
}
