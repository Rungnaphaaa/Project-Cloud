import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],
  base: '/frontend/',
  server: {
    hmr: {
      path: '/frontend/', // ให้ Vite รู้ว่า WebSocket ควรอยู่ที่ path นี้
    }
  }
})