import { defineConfig } from '@adonisjs/transmit'
import { redis } from '@adonisjs/transmit/transports'
import env from '#start/env'
export default defineConfig({
  pingInterval: false,
  transport: {
    driver: redis({
      host: env.get('REDIS_HOST'),
      port: env.get('REDIS_PORT'),
      password: env.get('REDIS_PASSWORD'),
      keyPrefix: 'transmit',
    }),
  },
})
