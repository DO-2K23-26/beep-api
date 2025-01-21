import Channel from './channel.js'

export enum ChannelType {
  TEXT_SERVER = 0,
  VOICE_SERVER = 1,
  PRIVATE_CHAT = 2,
  FOLDER_SERVER = 3,
}

export interface ChannelGroup {
  channels: Channel[]
}
