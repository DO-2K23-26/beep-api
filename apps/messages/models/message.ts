import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import User from '#apps/users/models/user'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Attachment from '#apps/storage/models/attachment'
import Channel from '#apps/channels/models/channel'
export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column()
  declare content: string

  @column()
  declare ownerId: string

  @column()
  declare channelId: string

  @belongsTo(() => User)
  declare owner: BelongsTo<typeof User>

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @hasMany(() => Attachment)
  declare attachments: HasMany<typeof Attachment>

  @beforeCreate()
  static async generateUuid(model: Message) {
    model.id = randomUUID()
  }
}
