import { Grid } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import type { ThemeEnvironmentProps } from '../types'

export function DatacenterEnvironment({ scene }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.018
    scene3d.background = new THREE.Color('#01080a')
    scene3d.fog = new THREE.FogExp2('#020d0f', fogDensity)
  }, [config?.fogDensity, scene3d])

  return (
    <>
      {/* Iluminación local: sin HDR externos para funcionar sin internet */}
      <hemisphereLight args={['#a7f3d0', '#020d0f', 0.4]} />
      <ambientLight intensity={0.2} color="#34d399" />
      <pointLight position={[0, 12, 4]} intensity={0.9} color="#10b981" distance={55} decay={2} />
      <pointLight position={[12, 6, -8]} intensity={0.5} color="#22d3ee" distance={45} decay={2} />
      <Grid
        position={[0, 0.01, 0]}
        args={[120, 120]}
        cellSize={1.2}
        cellThickness={0.5}
        cellColor="#065f46"
        sectionSize={6}
        sectionThickness={1}
        sectionColor="#34d399"
        fadeDistance={70}
        fadeStrength={1.2}
        infiniteGrid
      />
    </>
  )
}
