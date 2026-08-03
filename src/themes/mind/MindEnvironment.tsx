import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeEnvironmentProps } from '../types'

function BrainMass({ position, scale, color }: { position: [number, number, number]; scale: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 24)
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      const v = new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2])
      const noise =
        Math.sin(v.x * 3.5 + v.y * 2.1) * Math.cos(v.z * 2.8) * 0.18 +
        Math.sin(v.y * 4.2 + v.z * 3.3) * 0.12 +
        Math.cos(v.x * 5.1) * Math.sin(v.z * 4.5) * 0.1
      const elongateY = 1 + (v.y > 0 ? v.y * 0.35 : v.y * 0.15)
      const pinch = 1 - Math.abs(v.y) * 0.25
      v.normalize().multiplyScalar(1 + noise).multiplyScalar(pinch)
      v.y *= elongateY
      pos[i] = v.x
      pos[i + 1] = v.y
      pos[i + 2] = v.z
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.02
    meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.03
  })

  return (
    <mesh ref={meshRef} position={position} scale={[scale * 1.1, scale * 0.85, scale]} geometry={geometry}>
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.08}
        roughness={0.4}
        metalness={0.1}
        transmission={0.35}
        transparent
        opacity={0.22}
        clearcoat={0.6}
        clearcoatRoughness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function MindEnvironment({ scene }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.018
    scene3d.background = new THREE.Color('#080510')
    scene3d.fog = new THREE.FogExp2('#080510', fogDensity)
  }, [config?.fogDensity, scene3d])

  return (
    <>
      <ambientLight intensity={0.18} color="#4c1d95" />
      <directionalLight
        position={[8, 12, 8]}
        intensity={0.4}
        color="#a78bfa"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 8, 0]} intensity={0.7} color="#22d3ee" distance={50} decay={2} />
      <pointLight position={[-12, 4, -8]} intensity={0.4} color="#ec4899" distance={45} decay={2} />
      <pointLight position={[12, 4, -8]} intensity={0.4} color="#8b5cf6" distance={45} decay={2} />

      {/* Hemisferios cerebrales de fondo */}
      <group position={[0, -6, -18]} rotation={[0.15, 0, 0]}>
        <BrainMass position={[-2.8, 0, 0]} scale={5.5} color="#8b5cf6" />
        <BrainMass position={[2.8, 0, 0]} scale={5.5} color="#22d3ee" />
      </group>

      {/* Suelo orgánico sutil */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#0f0820" roughness={0.85} metalness={0.1} />
      </mesh>
    </>
  )
}
