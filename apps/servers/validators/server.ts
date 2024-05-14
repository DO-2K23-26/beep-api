import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

/**
 * Validator to validate the payload when creating
 * a new server.ts.
 */
export const createServerValidator = vine.compile(
  vine.object({})
)

/**
 * Validator to validate the payload when updating
 * an existing server.ts.
 */
export const updateServerValidator = vine.compile(
  vine.object({})
)

export type CreateServersSchema = Infer<typeof createServerValidator>
export type UpdateServersSchema = Infer<typeof updateServerValidator>