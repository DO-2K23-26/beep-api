import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'
import {VineMultipartFile} from "#apps/shared/vineType/vine_multipart_file";

/**
 * Validator to validate the payload when creating
 * a new storage.ts.
 */
export const createStorageValidator = vine.withMetaData<{ ownerId: string }>().compile(
  vine.object({
    messageId: vine
      .string()
      .uuid({ version: [4] })
      .exists((db, value, fields) => {
        return db
          .from('messages')
          .where('id', value)
          .andWhere('owner_id', fields.meta.ownerId)
          .firstOrFail()
      }),
    attachment: vine.multipartFile(),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing storage.ts.
 */
export const updateStorageValidator = vine
  .withMetaData<{ ownerId: string }>() //TODO: check that the user has the right on the channel
  .compile(
    vine.object({
      attachment: new VineMultipartFile(),
      params: vine.object({
        id: vine
          .string()
          .uuid({ version: [4] })
          .exists((db, value, fields) => {
            return db
              .from('attachments')
              .where('attachments.id', value)
              .join('messages', 'attachments.message_id', 'messages.id')
              .andWhere('owner_id', fields.meta.ownerId)
              .firstOrFail()
          }),
      }),
    })
  )

export type CreateStorageSchema = Infer<typeof createStorageValidator>
export type UpdateStorageSchema = Infer<typeof updateStorageValidator>
