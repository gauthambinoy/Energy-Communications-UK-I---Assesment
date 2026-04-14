// Vite configuration
// Vite is the build tool that runs our React app in development
// and bundles it for production

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    // React plugin — enables JSX and fast refresh during development
    react(),
    // Tailwind plugin — processes Tailwind utility classes
    tailwindcss(),
  ],

  // Proxy API requests to our backend during development
  // When the frontend calls /api/anything, Vite forwards it to localhost:3001
  // This avoids CORS issues and mimics a production setup
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});