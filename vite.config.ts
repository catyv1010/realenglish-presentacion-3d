import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas en el build. Sin esto, dist/index.html pide /assets/... con
  // barra al inicio y abierto con doble clic (file://) queda en blanco. Con
  // base './' la presentacion se abre sin servidor, sin terminal y sin npm:
  // es la version a prueba de fallos para el dia de la defensa.
  base: './',
  plugins: [react()],
})
