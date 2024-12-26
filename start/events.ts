import emitter from '@adonisjs/core/services/emitter'
import transmit from '@adonisjs/transmit/services/main'

declare module '@adonisjs/core/types' {
  interface EventsList {
    'user:mentioned': UserMentionedInMessageNotification & NotificationMeta
    'friend:request': FriendRequestNotification & NotificationMeta
  }
}

export enum NOTIFICATION_TYPE {
  USER_MENTIONED_IN_MESSAGE,
  FRIEND_REQUEST, // add message_type
}

export interface NotificationMeta {
  receiverId: string
}

export interface FriendRequestNotification {
  senderName: string
}

export interface UserMessagedNotification {
  // a suivre ...
  senderName: string
}

export interface UserMentionedInMessageNotification {
  serverName: string
  channelName: string
  senderName: string
}

export interface Notification {
  type: NOTIFICATION_TYPE
  payload: FriendRequestNotification | UserMentionedInMessageNotification
}

emitter.on('user:mentioned', (mention) => {
  const notification: Notification = {
    type: NOTIFICATION_TYPE.USER_MENTIONED_IN_MESSAGE,
    payload: mention,
  }
  transmit.broadcast(`notifications/users/${mention.receiverId}`, {
    event: JSON.stringify(notification),
  })
})

emitter.on('friend:request', (friendRequest) => {
  const notification: Notification = {
    type: NOTIFICATION_TYPE.FRIEND_REQUEST,
    payload: friendRequest,
  }
  transmit.broadcast(`notifications/users/${friendRequest.receiverId}`, {
    event: JSON.stringify(notification),
  })
})
