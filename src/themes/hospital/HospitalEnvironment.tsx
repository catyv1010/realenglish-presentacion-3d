import { Grid } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import type { ThemeEnvironmentProps } from '../types'

export function HospitalEnvironment({ scene }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.014
    scene3d.background = new THREE.Color('#030a12')
    scene3d.fog = new THREE.FogExp2('#04121c', fogDensity)
  }, [config?.fogDensity, scene3d])

  return (
    <>
      {/* Iluminación local: sin HDR externos para funcionar sin internet */}
      <hemisphereLight args={['#7dd3fc', '#04121c', 0.4]} />
      <ambientLight intensity={0.18} color="#7dd3fc" />
      <directionalLight position={[12, 20, 8]} intensity={0.6} color="#e0f2fe" castShadow />
      <pointLight position={[0, 12, 0]} intensity={0.9} color="#22d3ee" distance={60} decay={2} />
      <pointLight position={[-14, 6, -10]} intensity={0.5} color="#f87171" distance={40} decay={2} />
      <Grid
        position={[0, 0.01, 0]}
        args={[120, 120]}
        cellSize={1.5}
        cellThickness={0.5}
        cellColor="#0e7490"
        sectionSize={7.5}
        sectionThickness={1}
        sectionColor="#22d3ee"
        fadeDistance={75}
        fadeStrength={1.3}
        infiniteGrid
      />
    </>
  )
}
