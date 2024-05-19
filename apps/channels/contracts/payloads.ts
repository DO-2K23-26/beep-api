interface JoinChannelPayload {
  server_id: string
  channel_id: string
}

interface StreamPayload {
  channel_id: string
  audio: Blob
}

export type { JoinChannelPayload, StreamPayload }
