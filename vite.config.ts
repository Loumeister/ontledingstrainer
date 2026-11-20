import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { validateFrontendEnv } from './scripts/security-check.mjs'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  validateFrontendEnv({ ...loadEnv(mode, process.cwd(), 'VITE_'), ...process.env });
  return {
  plugins: [react()],
  // Custom-domain deployment serves from site root.
  base: '/',
  server: { host: 'localhost', proxy: { '/api': 'http://localhost:8787' } },
  }
})
