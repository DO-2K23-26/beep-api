import env from '#start/env'

export type S3Config = {
  region: string
  credentials: { accessKeyId: string; secretAccessKey: string }
}

declare function defineConfig(config: Partial<S3Config>): S3Config

/**
 * Configuration options for S3Driver.
 */

export const s3Config = defineConfig({
  region: env.get('S3_REGION'),
  credentials: { accessKeyId: env.get('S3_KEY'), secretAccessKey: env.get('S3_SECRET') },
})
