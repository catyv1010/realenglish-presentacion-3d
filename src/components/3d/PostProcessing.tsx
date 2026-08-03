import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  HueSaturation,
  BrightnessContrast,
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
  return (
    <EffectComposer multisampling={quality === 'low' ? 0 : 4}>
      <Bloom intensity={0.28} luminanceThreshold={0.88} luminanceSmoothing={0.3} mipmapBlur />
      <HueSaturation saturation={0.22} />
      <BrightnessContrast brightness={-0.02} contrast={0.14} />
      <Vignette eskil={false} offset={0.28} darkness={0.28} />
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
