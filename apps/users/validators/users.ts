import { VineMultipartFile } from '#apps/shared/vineType/vine_multipart_file'
import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

/**
 * Validator to validate the payload when updating
 * the email adress.
 */
export const emailUpdateValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
  })
)

export const confirmEmailUpdateValidator = vine.compile(
  vine.object({
    token: vine.string().jwt(),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    username: vine.string().optional(),
    firstName: vine.string().optional(),
    lastName: vine.string().optional(),
    email: vine.string().email().optional(),
    profilePicture: new VineMultipartFile().nullable().optional(),
  })
)

export type UpdateUserValidator = Infer<typeof updateUserValidator>
