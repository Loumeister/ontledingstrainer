import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // BELANGRIJK: Dit moet matchen met je GitHub repository naam
  // Als je repo 'ontledingstrainer' heet, moet dit '/ontledingstrainer/' zijn.
  base: '/ontledingstrainer/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test-setup.ts',
  },
})