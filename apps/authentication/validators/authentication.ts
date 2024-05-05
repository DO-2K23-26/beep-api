import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

export const signinAuthenticationValidator = vine.compile(
  vine.object({
    email: vine.string(),
    password: vine.string(),
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
  })
)

/**
 * Validator to validate the payload when updating
 * an existing authentication.ts.
 */
export const updateAuthenticationValidator = vine.compile(
  vine.object({})
)

export type SigninAuthenticationSchema = Infer<typeof signinAuthenticationValidator>
export type CreateAuthenticationSchema = Infer<typeof createAuthenticationValidator>
export type UpdateAuthenticationSchema = Infer<typeof updateAuthenticationValidator>
