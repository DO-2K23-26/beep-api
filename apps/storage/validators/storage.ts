import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

/**
 * Validator to validate the payload when creating
 * a new storage.ts.
 */
export const createStorageValidator = vine.compile(
  vine.object({})
)

/**
 * Validator to validate the payload when updating
 * an existing storage.ts.
 */
export const updateStorageValidator = vine.compile(
  vine.object({})
)

export type CreateStorageSchema = Infer<typeof createStorageValidator>
export type UpdateStorageSchema = Infer<typeof updateStorageValidator>