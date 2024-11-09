import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

/**
 * Validator to validate the payload when creating
 * a new channel.
 */
export const createChannelValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1), // name is not empty and must be given
    type: vine.string().in(['text', 'voice']),
  })
)

/**
 * Validator to validate the payload when updating
 * an existing channel.
 * Typically, for an update, not all fields are required.
 */
export const updateChannelValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).optional(), // The name is optional for the update, but if provided, it must be non-empty
    description: vine.string().minLength(1).optional(), // Same principle applies to the description
    // It is not permitted/possible to update the type of a channel ; its id, its serverId, etc.
  })
)

/**
 * Validator to validate the show action
 */
export const showChannelValidator = vine.compile(
  vine.object({
    messages: vine.boolean().optional(),
    users: vine.boolean().optional(),
    params: vine.object({
      id: vine.string().uuid({ version: [4] }),
    }),
  })
)

/**
 * Validator to validate the index action
 */
export const indexChannelValidator = vine.compile(
  vine.object({
    messages: vine.boolean().optional(),
    users: vine.boolean().optional(),
    onlyAccess: vine.boolean().optional(),
  })
)

/**
 * Validator to validate the subscribe action
 */
export const joinChannelValidator = vine.compile(
  vine.object({
    params: vine.object({
      id: vine.string().uuid({ version: [4] }),
    }),
  })
)

export type CreateChannelSchema = Infer<typeof createChannelValidator>
export type UpdateChannelSchema = Infer<typeof updateChannelValidator>
export type ShowChannelSchema = Infer<typeof showChannelValidator>
export type SubscribeChannelSchema = Infer<typeof joinChannelValidator>
export type IndexChannelSchema = Infer<typeof indexChannelValidator>
