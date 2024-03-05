import vine from '@vinejs/vine'
import { Infer } from '@vinejs/vine/types'

/**
 * Validator to validate the payload when creating
 * a new channel.
 */
export const createChannelValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1), // Assurez-vous que le nom est une chaîne non vide et obligatoire
  })
)

/**
 * Validator to validate the payload when updating
 * an existing channel.
 * Généralement, pour une mise à jour, les champs ne sont pas tous obligatoires.
 */
export const updateChannelValidator = vine.compile(
  vine.object({
    id: vine.string().uuid({ version: [4] }),
    name: vine.string().minLength(1).optional(), // Le nom est facultatif pour la mise à jour, mais s'il est fourni, il doit être non vide
  })
)

/**
 * Validator to validate the show action
 */
export const showChannelValidator = vine.compile(
  vine.object({
    messages: vine.boolean().optional(),
    params: vine.object({
      id: vine.string().uuid({ version: [4] }),
    }),
  })
)

export type CreateChannelSchema = Infer<typeof createChannelValidator>
export type UpdateChannelSchema = Infer<typeof updateChannelValidator>
export type ShowChannelSchema = Infer<typeof showChannelValidator>
