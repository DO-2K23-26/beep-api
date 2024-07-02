export interface OccupiedChannel {
  channelId: string
  users: CachedUser[]
}

export interface CachedUser {
  id: string
  username: string
  muted?: boolean
  voiceMuted?: boolean
  camera?: boolean
}
