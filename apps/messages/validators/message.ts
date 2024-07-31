import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'
import { VineMultipartFile } from '#apps/shared/vineType/vine_multipart_file'

/**
 * Validator to validate the payload when creating
 * a new message.ts.
 */
export const createMessageValidator = vine.compile(
  vine.object({
    content: vine.string(),
    attachments: vine.array(new VineMultipartFile()).optional(),
    parentMessageId: vine.string().optional(),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing message.ts.
 */
export const updateMessageValidator = vine.compile(
  vine.object({
    content: vine.string(),
  })
)

export const pinMessageValidator = vine.compile(
  vine.object({
    action: vine.string().in(['pin', 'unpin']),
  })
)

export type CreateMessagesSchema = Infer<typeof createMessageValidator>
export type UpdateMessagesSchema = Infer<typeof updateMessageValidator>
export type PinMessagesSchema = Infer<typeof pinMessageValidator>
