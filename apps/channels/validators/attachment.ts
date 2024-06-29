import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

export const getAttachmentValidator = vine.compile(
  vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional(),
  })
)

export type GetAttachementSchema = Infer<typeof getAttachmentValidator>
