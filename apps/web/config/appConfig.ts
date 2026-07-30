/**
 * Build/deploy configuration, resolved from environment variables. Keep this pure
 * (env in, typed config out) so it stays testable and can be reused wherever the
 * config is needed. Consumed by `vite.config.ts`; grows as more settings are added.
 */

export type AppConfig = {
  /** Port for the Vite dev + preview server. */
  port: number
}

const DEFAULT_PORT = 3000

/** Resolve the app config from an env record (e.g. Vite's `loadEnv` output). */
export function loadAppConfig(env: Record<string, string | undefined>): AppConfig {
  return { port: parsePort(env.APP_PORT) }
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw === '') return DEFAULT_PORT
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0 || n > 65535) {
    throw new Error(`Invalid APP_PORT: "${raw}" (expected an integer 1–65535)`)
  }
  return n
}
