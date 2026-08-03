import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { ReflectiveFloor } from '../../components/3d/ReflectiveFloor'
import { AudioReactiveFloor } from '../../components/3d/AudioReactiveFloor'
import type { ThemeEnvironmentProps } from '../types'

export function CyberpunkEnvironment({ scene }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.02
    scene3d.background = new THREE.Color('#020205')
    scene3d.fog = new THREE.FogExp2('#020205', fogDensity)
  }, [config?.fogDensity, scene3d])

  return (
    <>
      <ambientLight intensity={0.2} color="#1e1b4b" />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.5}
        color="#818cf8"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 10, 0]} intensity={0.6} color="#06b6d4" distance={40} />

      {config?.reflectiveFloor ? <ReflectiveFloor /> : config?.showGrid !== false && <AudioReactiveFloor />}
    </>
  )
}
