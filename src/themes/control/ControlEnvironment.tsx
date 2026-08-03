import { Grid } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import type { ThemeEnvironmentProps } from '../types'

export function ControlEnvironment({ scene }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.016
    scene3d.background = new THREE.Color('#02060f')
    scene3d.fog = new THREE.FogExp2('#030a16', fogDensity)
  }, [config?.fogDensity, scene3d])

  return (
    <>
      {/* Iluminación local: sin HDR externos para funcionar sin internet */}
      <hemisphereLight args={['#bae6fd', '#030a16', 0.4]} />
      <ambientLight intensity={0.2} color="#38bdf8" />
      <pointLight position={[0, 14, 2]} intensity={1} color="#0ea5e9" distance={60} decay={2} />
      <pointLight position={[-10, 5, 12]} intensity={0.4} color="#818cf8" distance={40} decay={2} />
      <Grid
        position={[0, 0.01, 0]}
        args={[120, 120]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#075985"
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#38bdf8"
        fadeDistance={70}
        fadeStrength={1.2}
        infiniteGrid
      />
    </>
  )
}
