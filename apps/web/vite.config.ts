import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadAppConfig } from './config/appConfig.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix so non-VITE_ vars (APP_PORT) are loaded too.
  const env = loadEnv(mode, process.cwd(), '')
  const config = loadAppConfig(env)

  return {
    plugins: [react(), tailwindcss()],
    server: { port: config.port, strictPort: true },
    preview: { port: config.port, strictPort: true },
  }
})
