import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server proxies /api to the Express backend on :4000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // host:true => also listen on your LAN IP so others on the same Wi-Fi can reach it.
    host: true,
    // allowedHosts:true => accept tunnel domains (ngrok/cloudflare) for link sharing.
    // Fine for testing/demos; tighten or remove for production.
    allowedHosts: true,
    proxy: {
      // The tester's browser calls /api on the SAME origin; Vite proxies it to the
      // backend running on YOUR machine, so you only need to expose port 5173.
      '/api': 'http://localhost:4000',
    },
  },
});
