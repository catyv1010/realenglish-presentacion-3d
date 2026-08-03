import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { ThemeEnvironmentProps } from '../types'

export function BrainEnvironment({ scene }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)
  const brainRef = useRef<THREE.Group>(null)
  const { scene: brainScene } = useGLTF('/models/brain.glb')

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.015
    scene3d.background = new THREE.Color('#05030a')
    scene3d.fog = new THREE.FogExp2('#05030a', fogDensity)
  }, [config?.fogDensity, scene3d])

  useFrame((state) => {
    if (!brainRef.current) return
    brainRef.current.rotation.y = state.clock.elapsedTime * 0.03
    brainRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.02
  })

  return (
    <>
      <ambientLight intensity={0.15} color="#4c1d95" />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.6}
        color="#a78bfa"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 8, 0]} intensity={0.8} color="#22d3ee" distance={60} decay={2} />
      <pointLight position={[-10, 2, -8]} intensity={0.5} color="#ec4899" distance={50} decay={2} />
      <pointLight position={[10, 2, -8]} intensity={0.5} color="#8b5cf6" distance={50} decay={2} />

      {/* Cerebro realista central */}
      <group ref={brainRef} position={[0, 5, -8]} scale={8}>
        <primitive object={brainScene.clone()} />
      </group>

      {/* Suelo reflectivo oscuro */}
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0a0612" roughness={0.6} metalness={0.3} />
      </mesh>
    </>
  )
}
