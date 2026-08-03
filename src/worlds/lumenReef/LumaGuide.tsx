import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

interface LumaGuideProps {
  position?: [number, number, number]
}

export function LumaGuide({ position = [3, 2.5, 3] }: LumaGuideProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bellRef = useRef<THREE.Mesh>(null)
  const tentaclesRef = useRef<THREE.Group>(null)

  const tentacles = useMemo(() => Array.from({ length: 10 }, (_, i) => i), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.25
      groupRef.current.position.x = position[0] + Math.cos(t * 0.35) * 0.3
      groupRef.current.position.z = position[2] + Math.sin(t * 0.28) * 0.3
    }
    if (bellRef.current) {
      bellRef.current.scale.setScalar(1 + Math.sin(t * 1.6) * 0.04)
    }
    if (tentaclesRef.current) {
      tentaclesRef.current.children.forEach((child, i) => {
        child.rotation.z = Math.sin(t * 1.2 + i * 0.7) * 0.18
        child.rotation.x = Math.cos(t * 0.9 + i * 0.5) * 0.12
      })
    }
  })

  return (
    <group ref={groupRef} scale={1.6}>
      {/* Campana de la medusa */}
      <mesh ref={bellRef}>
        <sphereGeometry args={[0.45, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#22d3ee"
          roughness={0.15}
          metalness={0.1}
          transmission={0.5}
          thickness={0.6}
          transparent
          opacity={0.7}
          emissive="#22d3ee"
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>

      {/* Núcleo brillante */}
      <mesh>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#22d3ee" emissiveIntensity={2} toneMapped={false} />
      </mesh>

      {/* Tentáculos */}
      <group ref={tentaclesRef} position={[0, -0.1, 0]}>
        {tentacles.map((i) => (
          <mesh key={i} position={[Math.cos(i * 0.63) * 0.18, -0.5, Math.sin(i * 0.63) * 0.18]} rotation={[0, 0, i * 0.63]}>
            <cylinderGeometry args={[0.02, 0.008, 1.2, 6, 4, true]} />
            <meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={0.5} transparent opacity={0.6} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      <pointLight color="#22d3ee" intensity={6} distance={12} decay={2} />

      <Billboard position={[0, 1.4, 0]}>
        <Text fontSize={0.18} color="#22d3ee" anchorX="center" anchorY="middle">
          LUMA
        </Text>
      </Billboard>
    </group>
  )
}
