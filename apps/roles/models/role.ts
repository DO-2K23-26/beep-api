import Server from '#apps/servers/models/server'
import { generateSnowflake } from '#apps/shared/services/snowflake'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare permissions: number // Permissions are hexadecimals

  @column()
  declare color: number

  @column()
  declare serverId: string

  // Define the parent relationship (a role belongs to a server)
  @belongsTo(() => Server)
  declare server: BelongsTo<typeof Server>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Generate a snowflake unique ID for the role.
  // Snowflake IDs can be sorted by creation date.
  @beforeCreate()
  public static async generateUuid(model: Role) {
    if (model.$dirty.id) {
      model.id = generateSnowflake()
    }
  }
}
