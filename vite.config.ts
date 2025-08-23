import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react()
    ],
    base: '/',
    build: {
      outDir: 'dist',
    },
    define: {
      'process.env.VITE_GITHUB_CLIENT_ID': JSON.stringify(env.VITE_GITHUB_CLIENT_ID),
      'process.env.VITE_GITHUB_CLIENT_SECRET': JSON.stringify(env.VITE_GITHUB_CLIENT_SECRET),
      'process.env.VITE_ADMIN_PASSWORD': JSON.stringify(env.VITE_ADMIN_PASSWORD),
    },
  }
});