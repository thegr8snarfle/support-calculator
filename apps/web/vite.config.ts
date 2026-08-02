import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadAppConfig } from './config/appConfig.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix so non-VITE_ vars (APP_PORT) are loaded too.
  const env = loadEnv(mode, process.cwd(), '')
  const config = loadAppConfig(env)

  // Tauri mobile dev sets TAURI_DEV_HOST so a physical device can reach the dev
  // server. When unset (desktop / iOS simulator), bind to localhost as before.
  const host = process.env.TAURI_DEV_HOST

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: config.port,
      strictPort: true,
      host: host || false,
      hmr: host
        ? { protocol: 'ws', host, port: config.port + 1 }
        : undefined,
    },
    preview: { port: config.port, strictPort: true },
  }
})
