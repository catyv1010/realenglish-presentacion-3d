import { Environment } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import type { ThemeEnvironmentProps } from '../types'

export function NeuralEnvironment({ scene }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.015
    scene3d.background = new THREE.Color('#05030a')
    scene3d.fog = new THREE.FogExp2('#05030a', fogDensity)
  }, [config?.fogDensity, scene3d])

  return (
    <>
      <Environment preset="studio" blur={0.8} />
      <ambientLight intensity={0.12} color="#4c1d95" />
      <pointLight position={[0, 10, 0]} intensity={0.8} color="#a855f7" distance={60} decay={2} />
      <pointLight position={[10, 5, -10]} intensity={0.5} color="#22d3ee" distance={50} decay={2} />
    </>
  )
}
