import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: [
      "terrain-north-generations-lesser.trycloudflare.com",
      ".trycloudflare.com"  // ✅ हे add केल्यावर future URLs पण काम करतील
    ]
  }
})