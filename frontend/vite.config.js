import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,  // falls du den Port explizit setzen willst
    // WICHTIG: History Fallback aktivieren
    // So leitet Vite alle nicht gefundenen Routen an index.html weiter
    historyApiFallback: true
  }
})
