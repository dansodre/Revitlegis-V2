// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/Revitlegis-V2/', // <<-- ADICIONE ESTA LINHA! Use o nome exato do seu repositório.
  plugins: [
    react(),
    tailwindcss(),
  ],
})