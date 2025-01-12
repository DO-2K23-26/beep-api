import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

/**
 * Validator to validate the payload when creating
 * a new member.ts.
 */
export const createMemberValidator = vine.compile(
  vine.object({
    nick: vine.string().trim(),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing member.ts.
 */
export const updateMemberValidator = vine.compile(
  vine.object({
    nickname: vine.string().trim().optional(),
  })
)

export type CreateMembersSchema = Infer<typeof createMemberValidator>
export type UpdateMembersSchema = Infer<typeof updateMemberValidator>
