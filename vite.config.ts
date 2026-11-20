/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // jsdom = un faux navigateur en mémoire, pour que React puisse "afficher" pendant les tests.
    environment: 'jsdom',
    // Fichier exécuté avant les tests (ajoute des vérifications comme toBeInTheDocument).
    setupFiles: ['./src/setupTests.ts'],
  },
})
