import { Stars } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import type { ThemeEnvironmentProps } from '../types'

export function CosmosEnvironment({ scene }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.008
    scene3d.background = new THREE.Color('#02040a')
    scene3d.fog = new THREE.FogExp2('#02040a', fogDensity)
  }, [config?.fogDensity, scene3d])

  return (
    <>
      <ambientLight intensity={0.05} color="#1e3a8a" />
      <pointLight position={[0, 0, 0]} intensity={1.2} color="#f59e0b" distance={100} decay={1.5} />
      <pointLight position={[-20, 10, -20]} intensity={0.6} color="#3b82f6" distance={80} decay={2} />
      <Stars radius={120} depth={60} count={5000} factor={4} saturation={0.8} fade speed={0.5} />
    </>
  )
}
