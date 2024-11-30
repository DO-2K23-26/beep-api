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

/**
 * Validator for the OTP generation request
 */
export const otpEmailValidator = vine.compile(
  vine.object({
    email: vine.string().email(), // Ensuring that emailValidator is a valid email address
  })
)

export const confirmEmailUpdateValidator = vine.compile(
  vine.object({
    token: vine.string().jwt(),
  })
)

export const getUsersValidator = vine.compile(
  vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional(),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    username: vine.string().optional(),
    firstName: vine.string().optional(),
    lastName: vine.string().optional(),
    email: vine.string().email().optional(),
    profilePicture: new VineMultipartFile().nullable().optional(),
    description: vine.string().optional(),
    status: vine.string().optional(),
  })
)

export const getMultipleUserValidator = vine.compile(
  vine.object({
    ids: vine.array(vine.string()).optional(),
  })
)

export type UpdateUserValidator = Infer<typeof updateUserValidator>
export type GetMultipleUserValidator = Infer<typeof getMultipleUserValidator>
export type GetUsersSchema = Infer<typeof getUsersValidator>
export type OtpEmailValidator = Infer<typeof otpEmailValidator>
