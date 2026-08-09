import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  HueSaturation,
  BrightnessContrast,
  N8AO,
} from '@react-three/postprocessing'
import { usePresentationStore } from '../../store/usePresentationStore'
import type { QualityLevel } from '../../types/presentation'

interface PostProcessingProps {
  quality: QualityLevel
}

function LowQualityEffects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={1.0} luminanceThreshold={0.3} luminanceSmoothing={0.55} mipmapBlur />
      <Vignette eskil={false} offset={0.4} darkness={0.5} />
      <BrightnessContrast brightness={0.02} contrast={0.08} />
    </EffectComposer>
  )
}

function MediumQualityEffects() {
  return (
    <EffectComposer multisampling={2}>
      <Bloom intensity={1.3} luminanceThreshold={0.25} luminanceSmoothing={0.5} mipmapBlur />
      <ChromaticAberration offset={[0.0008, 0.0008]} radialModulation modulationOffset={0.5} />
      <Noise opacity={0.025} />
      <HueSaturation saturation={0.12} />
      <BrightnessContrast brightness={0.03} contrast={0.1} />
      <Vignette eskil={false} offset={0.4} darkness={0.55} />
    </EffectComposer>
  )
}

function HighQualityEffects() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom intensity={1.6} luminanceThreshold={0.2} luminanceSmoothing={0.45} mipmapBlur />
      <ChromaticAberration offset={[0.001, 0.001]} radialModulation modulationOffset={0.5} />
      <Noise opacity={0.03} />
      <HueSaturation saturation={0.15} />
      <BrightnessContrast brightness={0.04} contrast={0.12} />
      <Vignette eskil={false} offset={0.35} darkness={0.6} />
    </EffectComposer>
  )
}

/**
 * Mundos claros (día): el bloom agresivo de los mundos oscuros quema toda la
 * pantalla a blanco. Aquí el bloom solo toca los brillos reales (umbral alto),
 * se sube un poco el contraste y la saturación para que los colores revienten.
 */
function LightWorldEffects({ quality }: { quality: QualityLevel }) {
  // Dos versiones enteras en vez de un hijo condicional: EffectComposer no
  // admite `false` ni fragmentos entre sus hijos (queda la pantalla en negro).
  if (quality === 'low') {
    return (
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.32} luminanceThreshold={0.86} luminanceSmoothing={0.3} mipmapBlur />
        <HueSaturation saturation={0.2} />
        <BrightnessContrast brightness={-0.01} contrast={0.13} />
        <Vignette eskil={false} offset={0.26} darkness={0.32} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={4}>
      {/* Oclusión ambiental: la sombra suave que aparece donde dos cosas se
          tocan. Es lo que hace que los árboles se vean apoyados en el suelo y
          no pegados encima. Siempre a media resolución: con este estilo de
          polígonos planos la diferencia no se ve y cuesta la mitad. */}
      <N8AO
        aoRadius={2.2}
        distanceFalloff={1.1}
        intensity={2.4}
        color="#2a3a5c"
        quality={quality === 'high' ? 'medium' : 'low'}
        halfRes
      />
      <Bloom intensity={0.32} luminanceThreshold={0.86} luminanceSmoothing={0.3} mipmapBlur />
      <HueSaturation saturation={0.2} />
      <BrightnessContrast brightness={-0.01} contrast={0.13} />
      <Vignette eskil={false} offset={0.26} darkness={0.32} />
    </EffectComposer>
  )
}

export function PostProcessing({ quality }: PostProcessingProps) {
  const scenes = usePresentationStore((state) => state.scenes)
  const currentSceneIndex = usePresentationStore((state) => state.currentSceneIndex)
  const lightWorld = scenes[currentSceneIndex]?.visualConfig?.lightWorld ?? false

  if (lightWorld) return <LightWorldEffects quality={quality} />
  if (quality === 'low') return <LowQualityEffects />
  if (quality === 'medium') return <MediumQualityEffects />
  return <HighQualityEffects />
}
