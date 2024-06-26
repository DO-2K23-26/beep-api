import Channel from '#apps/channels/models/channel'
import Message from '#apps/messages/models/message'
import Server from '#apps/servers/models/server'
import { generateSnowflake } from '#apps/shared/services/snowflake'
import Role from '#apps/users/models/role'
import { withAuthFinder } from '@adonisjs/auth'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, beforeCreate, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import Token from './token.js'
import Invitation from '#apps/invitations/models/invitation'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare serialNumber: string

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
    pivotTable: 'channels_users',
  })
  declare channels: ManyToMany<typeof Channel>

  @manyToMany(() => Server, {
    pivotTable: 'servers_users',
  })
  declare servers: ManyToMany<typeof Server>

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

  @hasMany(() => Invitation, {
    foreignKey: 'creatorId',
  })
  declare invitations: HasMany<typeof Invitation>

  @beforeCreate()
  static async generateUuid(model: User) {
    model.id = randomUUID()
    model.serialNumber = generateSnowflake()
  }
}
