import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

export const createVerifyValidator = vine.compile(
  vine.object({
    token: vine.string(),
  })
)

export type CreateVerifySchema = Infer<typeof createVerifyValidator>
