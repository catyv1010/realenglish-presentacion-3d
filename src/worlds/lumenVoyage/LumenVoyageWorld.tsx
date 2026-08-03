import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { WorldProps } from '../types'
import { VoyageCamera } from './VoyageCamera'
import { Scene1Environment } from './scene1/Scene1Environment'
import { Scene2Environment } from './scene2/Scene2Environment'
import { Scene3Environment } from './scene3/Scene3Environment'

export function LumenVoyageWorld({ scene, quality }: WorldProps) {
  const { gl } = useThree()
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = scene.visualConfig?.exposure ?? 1.0

  return (
    <>
      <VoyageCamera scene={scene} />
      {scene.id === 'scene-1' && <Scene1Environment quality={quality} />}
      {scene.id === 'scene-2' && <Scene2Environment quality={quality} />}
      {scene.id === 'scene-3' && <Scene3Environment quality={quality} />}
    </>
  )
}
