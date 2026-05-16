import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/loteria': {
        target: 'https://servicebus2.caixa.gov.br',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/loteria/, '/portaldeloterias/api'),
      },
    },
  },
})
