import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

export const createVerifyValidator = vine.compile(
  vine.object({
    token: vine.string(),
  })
)
export const updatePasswordValidator = vine.compile(
  vine.object({
    newPassword: vine.string(),
    oldPassword: vine.string().minLength(6),
  })
)

export type CreateVerifySchema = Infer<typeof createVerifyValidator>
export type UpdatePasswordValidator = Infer<typeof updatePasswordValidator>
