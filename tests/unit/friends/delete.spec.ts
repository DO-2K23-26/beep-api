import FriendService from '#apps/friends/services/friend_service'
import { FriendFactory } from '#database/factories/friend_factory'
import { test } from '@japa/runner'

test.group('Friends delete', () => {
  const friendService = new FriendService()
  test('must delete friendship from users', async ({ assert }) => {
    const friendship = await FriendFactory.create()
    await friendService.deleteFriendship(friendship.user_id, friendship.friend_id)
    const foundFriendship = await friendService.findFriendship(
      friendship.user_id,
      friendship.friend_id
    )
    assert.isNull(foundFriendship)
  })
})
