import factory from '@adonisjs/lucid/factories'
import Friend from '#apps/friends/models/friend'
import { UserFactory } from './user_factory.js'

export const FriendFactory = (userId: string) =>
  factory
    .define(Friend, async () => {
      const user = await UserFactory.create()

      return Friend.create({
        user_id: userId,
        friend_id: user.id,
      })
    })
    .build()
