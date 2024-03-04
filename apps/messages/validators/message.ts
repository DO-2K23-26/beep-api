import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'
import { VineMultipartFile } from '#apps/shared/vineType/vine_multipart_file'

/**
 * Validator to validate the payload when creating
 * a new message.ts.
 */
export const createMessageValidator = vine.withMetaData<{ ownerId: string }>().compile(
  vine.object({
    ownerId: vine
      .string()
      .uuid({ version: [4] })
      .bail(false)
      .transform((_, field) => field.meta.ownerId),
    channelId: vine
      .string()
      .uuid({ version: [4] })
      .exists((db, value) => {
        return db.from('channels').where('id', value).firstOrFail() //TODO: Add right check
      }),
    content: vine.string(),
    attachments: vine.array(new VineMultipartFile()).optional(),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing message.ts.
 */
export const updateMessageValidator = vine.withMetaData<{ ownerId: string }>().compile(
  vine.object({
    content: vine.string(),
    attachments: vine.array(new VineMultipartFile()),
    params: vine.object({
      id: vine
        .string()
        .uuid({ version: [4] })
        .exists((db, value, fields) => {
          return db
            .from('messages')
            .where('id', value)
            .andWhere('owner_id', fields.meta.ownerId)
            .firstOrFail()
        }),
    }),
  })
)

export type CreateMessagesSchema = Infer<typeof createMessageValidator>
export type UpdateMessagesSchema = Infer<typeof updateMessageValidator>
