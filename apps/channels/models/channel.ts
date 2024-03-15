import {BaseModel, beforeCreate, column, hasMany, manyToMany} from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import Message from '#apps/messages/models/message'
import type {HasMany, ManyToMany} from '@adonisjs/lucid/types/relations'
import User from "#apps/users/models/user";

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @manyToMany(() => User, {
    pivotTable: 'channel_users',
  })
  declare users: ManyToMany<typeof User>

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @beforeCreate()
  static async generateUuid(model: Channel) {
    model.id = randomUUID()
  }
}
