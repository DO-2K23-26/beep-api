import env from '#start/env'
import { defineConfig, services } from '@adonisjs/drive'

// region: env.get(''),
// endpoint: env.get('S3_ENDPOINT'),
// forcePathStyle: true,
// credentials: {
//   accessKeyId: env.get('S3_KEY'),
//   secretAccessKey: env.get('S3_SECRET'),
// },

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: {
    s3: services.s3({
      credentials: {
        accessKeyId: env.get('S3_KEY'),
        secretAccessKey: env.get('S3_SECRET'),
      },
      endpoint: env.get('S3_ENDPOINT'),
      forcePathStyle: true,
      region: env.get('S3_REGION'),
      bucket: env.get('S3_BUCKET_NAME'),
      visibility: 'public',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
