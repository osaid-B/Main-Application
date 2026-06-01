import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any request to /api/* is forwarded to the Django backend.
      // This eliminates CORS issues in development and means the frontend
      // can call /api/v1/... without knowing the backend origin.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
