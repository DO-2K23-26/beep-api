import Friend from '#apps/friends/models/friend'
import UserNotFoundException from '#apps/users/exceptions/user_not_found_exception'
import User from '#apps/users/models/user'
import { inject } from '@adonisjs/core'
import AlreadyFriendsException from '#apps/friends/exceptions/already_friends_exception'

@inject()
export default class FriendService {
  async deleteFriendship(friendId: string, userId: string): Promise<void> {
    const user = await Friend.query()
      .where('user_id', userId)
      .where('friend_id', friendId)
      .firstOrFail()
    await user.delete()
  }

  async createFriendship(userId: string, friendId: string): Promise<Friend> {
    await User.findOrFail(userId).catch(() => {
      throw new UserNotFoundException('User not found', { code: 'E_USER_NOT_FOUND', status: 404 })
    })
    await User.findOrFail(friendId).catch(() => {
      throw new UserNotFoundException('User not found', { code: 'E_USER_NOT_FOUND', status: 404 })
    })

    // Check if the friendship already exists
    const friendship = await Friend.query()
      .where(async (query) => {
        await query.where('user_id', userId).andWhere('friend_id', friendId)
      })
      .orWhere(async (query) => {
        await query.where('user_id', friendId).andWhere('friend_id', userId)
      })
      .first()
    if (friendship) {
      throw new AlreadyFriendsException('Already friends', {
        code: 'E_ALREADY_FRIENDS',
        status: 400,
      })
    }
    return Friend.create({ user_id: userId, friend_id: friendId })
  }

  async findByUser(userId: string): Promise<User[]> {
    const friendships = await Friend.query()
      .where('user_id', userId)
      .orWhere('friend_id', userId)
      .preload('user', (query) => {
        query.whereNot('id', userId).select(['id', 'username', 'profile_picture'])
      })
      .preload('friend', (query) => {
        query.whereNot('id', userId).select(['id', 'username', 'profile_picture'])
      })
    const friendsList = friendships.map((friendship) => {
      return friendship.user == undefined ? friendship.friend : friendship.user
    })
    return friendsList
  }
}
