import {
  afterCreate,
  afterFetch,
  afterFind,
  afterPaginate,
  afterSave,
  afterUpdate,
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
} from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import Message from '#apps/messages/models/message'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import env from '#start/env'
import { S3Driver } from '#apps/shared/drivers/s3_driver'
import * as querybuilder from '@adonisjs/lucid/types/querybuilder'

export default class Attachment extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column()
  declare name: string

  @column()
  declare contentType: string

  @column()
  declare url: string

  @column()
  declare messageId: string

  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>

  @beforeCreate()
  static async generateUuid(model: Attachment) {
    model.id = randomUUID()
  }

  // TODO fix this
  @afterCreate()
  @afterUpdate()
  @afterSave()
  @afterFind()
  static async generateUrl(model: Attachment) {
    model.url = await S3Driver.getInstance().getSignedUrl(
      env.get('S3_BUCKET_NAME') ?? 'app',
      model.name
    )
  }

  @afterFetch()
  static async generateUrlFetch(model: Attachment[]) {
    for (const attachment of model) {
      attachment.url = await S3Driver.getInstance().getSignedUrl(
        env.get('S3_BUCKET_NAME') ?? 'app',
        attachment.name
      )
    }
  }

  @afterPaginate()
  static async generateUrlPaginate(model: querybuilder.SimplePaginatorContract<Attachment>) {
    for (const attachment of model.all()) {
      attachment.url = await S3Driver.getInstance().getSignedUrl(
        env.get('S3_BUCKET_NAME') ?? 'app',
        attachment.name
      )
    }
  }
}
