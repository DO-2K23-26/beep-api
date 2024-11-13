import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'
import { VineMultipartFile } from '#apps/shared/vineType/vine_multipart_file'

export const signinAuthenticationValidator = vine.compile(
  vine.object({
    email: vine.string(),
    password: vine.string(),
  })
)

export const signinWithQRCodeAuthenticationValidator = vine.compile(
  vine.object({
    token: vine.string(),
    passKey: vine.string(),
  })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
  })
)

/**
 * Validator to validate the payload when creating
 * a new authentication.ts.
 */
export const createAuthenticationValidator = vine.compile(
  vine.object({
    username: vine.string(),
    firstname: vine.string(),
    lastname: vine.string(),
    email: vine.string(),
    password: vine.string(),
    profilePicture: new VineMultipartFile().nullable().optional(),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing authentication.ts.
 */
export const updateAuthenticationValidator = vine.compile(vine.object({}))

export type SigninAuthenticationSchema = Infer<typeof signinAuthenticationValidator>
export type CreateAuthenticationSchema = Infer<typeof createAuthenticationValidator>
export type UpdateAuthenticationSchema = Infer<typeof updateAuthenticationValidator>
export type ResetPasswordValidator = Infer<typeof resetPasswordValidator>
