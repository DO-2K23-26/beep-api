import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

/**
 * Validator to validate the payload when creating
 * a new invitation.ts.
 */
export const createInvitationValidator = vine.compile(
  vine.object({
    isUnique: vine.boolean(),
    expiration: vine.date({
      formats: { utc: true },
    }),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing invitation.ts.
 */
export const updateInvitationValidator = vine.compile(vine.object({}))

export type CreateInvitationsSchema = Infer<typeof createInvitationValidator>
export type UpdateInvitationsSchema = Infer<typeof updateInvitationValidator>
