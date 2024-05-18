import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import User from '#apps/users/models/user'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Channel from '#apps/channels/models/channel'
import Role from '#apps/users/models/role'
import Member from '#apps/members/models/member'
export default class Server extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare icon: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column()
  declare ownerId: string

  @belongsTo(() => User, {
    foreignKey: 'ownerId',
  })
  declare owner: BelongsTo<typeof User>

  @hasMany(() => Role)
  declare roles: HasMany<typeof Role>

  @manyToMany(() => User, {
    pivotTable: 'servers_users',
  })
  declare users: ManyToMany<typeof User>

  @hasMany(() => Member)
  declare members: HasMany<typeof Member>

  @hasMany(() => Channel)
  declare channels: HasMany<typeof Channel>

  @beforeCreate()
  static async generateUuid(model: Server) {
    model.id = randomUUID()
  }
}