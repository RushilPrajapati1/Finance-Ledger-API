var _a;
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The FinLedger backend ships no CORS middleware, so a browser can't call it
// cross-origin. In dev we proxy everything under /api to the backend on :8000
// and strip the prefix, so the app talks same-origin and CORS never applies.
//   /api/v1/accounts  ->  http://localhost:8000/v1/accounts
//   /api/health       ->  http://localhost:8000/health
var BACKEND = (_a = process.env.FINLEDGER_API_URL) !== null && _a !== void 0 ? _a : 'http://localhost:8000';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: BACKEND,
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api/, ''); },
            },
        },
    },
});
