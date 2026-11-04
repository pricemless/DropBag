import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, forward /api to the Express server so cookies stay same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
})
