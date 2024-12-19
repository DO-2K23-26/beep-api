import emitter from '@adonisjs/core/services/emitter'
import transmit from '@adonisjs/transmit/services/main'

declare module '@adonisjs/core/types' {
  interface EventsList {
    'user:mentioned': MentionPayload
    'user:messaged': MessagePayload
    'friend:request': FriendRequest
  }
}

export interface EventPayload {
  receiverId: string
  type: EVENTS
}

export interface MentionPayload extends EventPayload {
  senderName: string
  channelName: string
  serverName?: string
}

export interface MessagePayload extends EventPayload {
  senderName: string
  channelName: string
  serverName: string
  content: string
}

export interface FriendRequest extends EventPayload {
  senderName: string
}

export enum EVENTS {
  mentioned = 'USER_MENTIONED_IN_MESSAGE',
  messaged = 'USER_MESSAGED',
  friend_request = 'FRIEND_REQUEST',
}

emitter.on('user:mentioned', (mention) => {
  transmit.broadcast(`notifications/users/${mention.receiverId}`, {
    event: JSON.stringify(mention),
  })
})

emitter.on('user:messaged', (message) => {
  transmit.broadcast(`notifications/users/${message.receiverId}`, {
    event: JSON.stringify(message),
  })
})

emitter.on('friend:request', (friend_request) => {
  transmit.broadcast(`notifications/users/${friend_request.receiverId}`, {
    event: JSON.stringify(friend_request),
  })
})
