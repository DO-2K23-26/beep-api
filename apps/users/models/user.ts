import { DateTime } from 'luxon'
import { withAuthFinder } from '@adonisjs/auth'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeCreate, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { randomUUID } from 'node:crypto'
import Role from '#apps/users/models/role'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Message from '#apps/messages/models/message'
import Token from './token.js'
import Channel from '#apps/channels/models/channel'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare username: string

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare email: string

  @column()
  declare profilePicture: string

  @column({ serializeAs: null })
  declare password: string

  @manyToMany(() => Channel, {
    pivotTable: 'channel_users',
  })
  declare channels: ManyToMany<typeof Channel>

  @manyToMany(() => Role)
  declare roles: ManyToMany<typeof Role>

  @column()
  declare verifiedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Message)
  declare messages: HasMany<typeof Message>

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @hasMany(() => Token)
  declare tokens: HasMany<typeof Token>

  @beforeCreate()
  static async generateUuid(model: User) {
    model.id = randomUUID()
  }
}
