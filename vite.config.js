import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pglitePlugin } from './plugins/vite-plugin-pglite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pglitePlugin()],
  server: {
    port: 3000,
    open: false
  },
  build: {
    rollupOptions: {
      output: {
        // Librerías en archivos propios: cambian poco y el navegador las mantiene en caché.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    // Las pruebas siempre corren en modo demo, aunque .env.local tenga Supabase o PGlite:
    // así no dependen de la red ni de los datos de un proyecto real.
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_ANON_KEY: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
      VITE_USE_LOCAL_DB: 'false'
    },
    include: ['src/**/*.test.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
    // Los flujos completos (carta → cocina → caja) corren con varios archivos en paralelo:
    // en un equipo cargado 5 s no alcanzan.
    testTimeout: 30000
  }
});
