import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

/**
 * Validator to validate the payload when creating
 * a new role.ts.
 */
export const createRoleValidator = vine.compile(vine.object({}))

/**
 * Validator to validate the payload when updating
 * an existing role.ts.
 */
export const updateRoleValidator = vine.compile(vine.object({}))

export type CreateRoleSchema = Infer<typeof createRoleValidator>
export type UpdateRoleSchema = Infer<typeof updateRoleValidator>
