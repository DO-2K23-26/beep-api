import Friend from '#apps/friends/models/friend'
import UserNotFoundException from '#apps/users/exceptions/user_not_found_exception'
import User from '#apps/users/models/user'
import { inject } from '@adonisjs/core'

@inject()
export default class FriendService {
  async deleteFriendship(friendId: string, userId: string): Promise<void> {
    const user = await Friend.query()
      .where('user_id', userId)
      .where('friend_id', friendId)
      .firstOrFail()
    await user.delete()
  }

  async createFriendship(friendId: string, userId: string): Promise<Friend> {
    await User.findOrFail(friendId).catch(() => {
      throw new UserNotFoundException('User not found', { code: 'E_USER_NOT_FOUND', status: 404 })
    })
    return Friend.create({ user_id: userId, friend_id: friendId })
  }

  async findAllFriends(userId: string): Promise<Friend[]> {
    return Friend.query().where('user_id', userId)
  }
}
