import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The FinLedger backend ships no CORS middleware, so a browser can't call it
// cross-origin. In dev we proxy everything under /api to the backend on :8000
// and strip the prefix, so the app talks same-origin and CORS never applies.
//   /api/v1/accounts  ->  http://localhost:8000/v1/accounts
//   /api/health       ->  http://localhost:8000/health
const BACKEND = process.env.FINLEDGER_API_URL ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: BACKEND,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
