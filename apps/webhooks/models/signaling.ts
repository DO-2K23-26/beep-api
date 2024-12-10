import Webhook from '#apps/webhooks/models/webhook'

export enum ActionSignalWebhook {
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export interface SignalWebhook {
  action: ActionSignalWebhook
  webhook: Webhook
  transmitClientId?: string
}
