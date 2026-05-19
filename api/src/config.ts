/**
 * @module api-config
 *
 * Parse and validate API startup configuration from environment variables.
 *
 * @packageDocumentation
 */

import { type ConfigError, type EnvSchema, loadConfig } from '@tsfpp/boundary'
import { type Result, isErr, ok } from '@tsfpp/prelude'
import { z } from 'zod'

const rawApiConfigSchema = z.object({
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  MAX_BODY_BYTES: z.coerce.number().int().positive().default(262144),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

type ApiConfigEnv = z.infer<typeof rawApiConfigSchema>

const toIssuePath = (path: ReadonlyArray<PropertyKey>): ReadonlyArray<string | number> => path.reduce<ReadonlyArray<string | number>>(
  (acc, part) => (
    typeof part === 'string' || typeof part === 'number'
      ? [...acc, part]
      : acc
  ),
  [],
)

const apiConfigSchema: EnvSchema<ApiConfigEnv> = {
  safeParse: (input) => {
    const parsed = rawApiConfigSchema.safeParse(input)

    if (!parsed.success) {
      return {
        success: false,
        error: {
          issues: parsed.error.issues.map((issue) => ({
            path: toIssuePath(issue.path),
            message: issue.message,
          })),
        },
      }
    }

    return {
      success: true,
      data: parsed.data,
    }
  },
}

export type ApiConfig = {
  readonly host: string
  readonly port: number
  readonly maxBodyBytes: number
  readonly requestTimeoutMs: number
  readonly rateLimitWindowMs: number
  readonly rateLimitMaxRequests: number
  readonly nodeEnv: 'development' | 'test' | 'production'
}

/**
 * Parse API startup configuration from environment input.
 * @param env Environment variable record from the runtime boundary.
 * @returns Validated API configuration or a boundary config error.
 */
export const parseApiConfig = (
  env: Readonly<Record<string, string | undefined>>,
): Result<ApiConfig, ConfigError> => {
  const parsed = loadConfig(apiConfigSchema, env)

  if (isErr(parsed)) {
    return parsed
  }

  return ok({
    host: parsed.value.HOST,
    port: parsed.value.PORT,
    maxBodyBytes: parsed.value.MAX_BODY_BYTES,
    requestTimeoutMs: parsed.value.REQUEST_TIMEOUT_MS,
    rateLimitWindowMs: parsed.value.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: parsed.value.RATE_LIMIT_MAX_REQUESTS,
    nodeEnv: parsed.value.NODE_ENV,
  })
}
