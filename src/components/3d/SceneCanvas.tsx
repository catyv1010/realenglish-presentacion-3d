import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useEffect } from 'react'
import { usePresentationStore } from '../../store/usePresentationStore'
import { SceneController } from './SceneController'
import { PostProcessing } from './PostProcessing'
import { CameraFraming } from './CameraFraming'
import { ShootingStars } from './ShootingStars'
import { StarField } from './StarField'

function SceneBackground() {
  const currentSceneIndex = usePresentationStore((state) => state.currentSceneIndex)
  const scenes = usePresentationStore((state) => state.scenes)
  const scene = scenes[currentSceneIndex]
  const { scene: scene3d } = useThree()

  const backgroundColor = scene?.visualConfig?.backgroundColor ?? '#020205'

  useEffect(() => {
    scene3d.background = new THREE.Color(backgroundColor)
  }, [scene3d, backgroundColor])

  return null
}

function SceneToneMapping() {
  const currentSceneIndex = usePresentationStore((state) => state.currentSceneIndex)
  const scenes = usePresentationStore((state) => state.scenes)
  const scene = scenes[currentSceneIndex]
  const gl = useThree((state) => state.gl)

  const exposure = scene?.visualConfig?.exposure ?? 0.9

  useEffect(() => {
    gl.toneMappingExposure = exposure
  }, [gl, exposure])

  return null
}

export function SceneCanvas() {
  const quality = usePresentationStore((state) => state.quality)
  const currentSceneIndex = usePresentationStore((state) => state.currentSceneIndex)
  const scenes = usePresentationStore((state) => state.scenes)
  const currentScene = scenes[currentSceneIndex]

  const showStars = currentScene?.visualConfig?.showStars ?? true
  const showShootingStars = currentScene?.visualConfig?.showShootingStars ?? true
  const isExplorable = currentScene?.visualConfig?.isExplorable ?? false

  return (
    <Canvas
      shadows
      camera={{ fov: 60, near: 0.1, far: 400, position: [0, 15, 30] }}
      style={{ width: '100vw', height: '100vh' }}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
    >
      <SceneBackground />
      <SceneToneMapping />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enableZoom
        zoomSpeed={1.1}
        minDistance={2}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2.02}
      />
      {!isExplorable && <CameraFraming />}

      {showStars && <StarField />}
      {showShootingStars && <ShootingStars count={8} />}
      <SceneController />
      <PostProcessing quality={quality} />
    </Canvas>
  )
}
