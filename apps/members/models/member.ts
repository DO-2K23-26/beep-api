import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import User from '#apps/users/models/user'
import Server from '#apps/servers/models/server'
import Role from '#apps/users/models/role'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Member extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column()
  declare nickname: string

  @column()
  declare avatar: string

  @column()
  declare deaf: boolean

  @column()
  declare mute: boolean

  @column()
  declare pending: boolean

  @column.dateTime()
  declare timedOutUntil: DateTime | null

  @column()
  declare serverId: string

  @column()
  declare userId: string

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Server, {
    foreignKey: 'serverId',
  })
  declare server: BelongsTo<typeof Server>

  @hasMany(() => Role)
  declare roles: HasMany<typeof Role>

  @beforeCreate()
  static async generateUuid(model: Member) {
    model.id = randomUUID()
  }
}
