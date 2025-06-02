import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // String shorthand for simple cases:
      '/api': 'http://localhost:3000',

      // Using the object syntax for more control:
      // '/api': {
      //   target: 'http://localhost:3000', // Your backend server
      //   changeOrigin: true, // Needed for virtual hosted sites
      //   secure: false,      // Set to false if your backend is HTTP during development
      //   rewrite: (path) => path.replace(/^\/api/, ''), // Optional: rewrite path
      // },
      // You can add more proxy rules here if needed
      // For example, if you have another service:
      // '/another-api': {
      //   target: 'http://localhost:3002',
      //   changeOrigin: true,
      // }
    },
  },
})
