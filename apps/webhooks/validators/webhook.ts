import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'
// import { VineMultipartFile } from '#apps/shared/vineType/vine_multipart_file'

/**
 * Validator to validate the payload when creating
 * a new message.ts.
 */
export const createWebhookValidator = vine.compile(
  vine.object({
    name: vine.string(),
    profilePicture: vine.string().url(),
    serverId: vine.string(),
    channelId: vine.string(),
    token: vine.string(),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing message.ts.
 */
export const updateWebhookValidator = vine.compile(
  vine.object({
    name: vine.string(),
    profilePicture: vine.string().url(),
    serverId: vine.string(),
    channelId: vine.string(),
    token: vine.string(),
  })
)

// export const pinMessageValidator = vine.compile(
//   vine.object({
//     action: vine.string().in(['pin', 'unpin']),
//   })
// )

// export const getMessagesValidator = vine.compile(
//   vine.object({
//     limit: vine.number().optional(),
//     before: vine.string().optional(),
//   })
// )
// export type GetMessagesValidator = Infer<typeof getMessagesValidator>
export type CreateWebhooksSchema = Infer<typeof createWebhookValidator>
export type UpdateWebhookSchema = Infer<typeof updateWebhookValidator>
// export type PinMessagesSchema = Infer<typeof pinMessageValidator>
