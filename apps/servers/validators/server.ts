import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

/**
 * Validator to validate the payload when creating
 * a new server.
 */
export const createServerValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing server.
 */
export const updateServerValidator = vine.compile(
  vine.object({
    id: vine.string().uuid({ version: [4] }),
    name: vine.string().minLength(1).optional(),
    description: vine.string().optional(),
  })
)

/**
 * Validator to validate the index action
 */
export const indexServerValidator = vine.compile(
  vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional(),
  })
)

export type CreateServerSchema = Infer<typeof createServerValidator>
export type UpdateServerSchema = Infer<typeof updateServerValidator>
export type IndexServerSchema = Infer<typeof indexServerValidator>
