import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'
import { Permissions } from '#apps/shared/enums/permissions'

/**
 * Calculate the maximum value in the Permissions enum.
 */
const maxPermValue = Math.max(
  ...(Object.values(Permissions).filter((value) => typeof value === 'number') as number[])
)

/**
 * Validator to validate the payload when creating
 * a new role.ts.
 */
export const createRoleValidator = vine.compile(
  vine.object({
    name: vine.string(),
    permissions: vine.number().max(maxPermValue), // Permissions cannot exceed max existing value.
  })
)

/**
 * Validator to validate the payload when updating
 * an existing role.ts.
 */
export const updateRoleValidator = vine.compile(
  vine.object({
    name: vine.string(),
    permissions: vine.number().max(maxPermValue), // Permissions cannot exceed max existing value.
  })
)

export type CreateRoleSchema = Infer<typeof createRoleValidator>
export type UpdateRoleSchema = Infer<typeof updateRoleValidator>
