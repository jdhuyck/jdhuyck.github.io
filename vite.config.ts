import { defineConfig } from 'vite';

export default defineConfig({
  base: '/jdhuyck.github.io/',
  build: {
    outDir: 'dist',
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
});
