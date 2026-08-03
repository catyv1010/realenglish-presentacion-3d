# presentaciones-3d

Una presentación cinematográfica 3D interactiva que convierte conceptos de bases de datos en una ciudad cyberpunk animada.

## Características

- **Ciudad cyberpunk viva**: edificios animados, reflejos, hologramas, drones, partículas de datos y god rays.
- **Cámaras cinemáticas**: transiciones suaves y recorridos automáticos por escena.
- **Audio reactivo**: el motor de Web Audio API hace que edificios, luces y partículas pulsen al ritmo de la música.
- **Postprocesado**: bloom, aberración cromática y viñeta (según calidad).
- **Mundos temáticos tipo videojuego**: 7 mundos distintos que se construyen según el tema — Ciudad Médica (hospital), Nebulosa Oracle (cosmos), Red Neural del Modelo, Ciudad de Scripts (cyberpunk), Bóveda de Seguridad (vault), Centro de Respaldo (datacenter) y Sala de Control (control).
- **29 escenas** que exponen TODO el material del proyecto final de la Clínica San Rafael (SC-503).
- **Panel lateral colapsable** con el contenido detallado y fragmentos SQL: nunca tapa el mundo 3D.
- **Zoom con la rueda del mouse** siempre disponible en modos Manual y Libre.

## Tecnologías

- React 19 + TypeScript 6
- Vite 8
- React Three Fiber 9 + Drei
- @react-three/postprocessing
- GSAP
- Zustand

## Scripts

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Compila TypeScript y genera el bundle de Vite
npm run lint     # Ejecuta oxlint
npm run preview  # Previsualiza la build de producción
```

## Cómo usar

1. Ejecuta `npm run dev` y abre la URL que muestra Vite.
2. Navega manualmente o activa el modo **Auto** para recorridos automáticos.
3. Activa **Audio On** y sube el volumen para ver la ciudad reaccionar al ritmo.
4. Puedes subir tu propia pista de audio con el botón "Subir pista".

## Estructura destacada

- `src/audio/AudioEngine.ts`: motor Web Audio.
- `src/components/3d/AudioReactive*.tsx`: edificios, luces y partículas reactivas.
- `src/components/ui/AudioControls.tsx`: panel de audio.
- `src/components/3d/CityScene.tsx`: composición principal de la escena 3D.
- `src/data/sample-presentation.json`: configuración de las 9 escenas.
