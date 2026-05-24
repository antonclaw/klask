import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  envDir: '../..',
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        klask4: resolve(__dirname, 'klask-4.html'),
        klask4solo: resolve(__dirname, 'klask-4-solo.html'),
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
