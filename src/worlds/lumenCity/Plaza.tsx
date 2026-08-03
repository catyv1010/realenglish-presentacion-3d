import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Torus } from '@react-three/drei'
import * as THREE from 'three'

export function Plaza() {
  const ringRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.06
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.04
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Plataforma principal */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[6, 6.6, 0.2, 64]} />
        <meshStandardMaterial color="#1e293b" roughness={0.25} metalness={0.6} />
      </mesh>

      {/* Anillo decorativo giratorio */}
      <Torus ref={ringRef} args={[6.8, 0.08, 12, 128]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.2} toneMapped={false} />
      </Torus>

      {/* Monumento central: columna de datos */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.9, 4, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.85} />
      </mesh>
      <mesh ref={innerRef} position={[0, 2.2, 0]}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.5} toneMapped={false} transparent opacity={0.9} />
      </mesh>

      {/* Luz del monumento */}
      <pointLight position={[0, 3.5, 0]} color="#22d3ee" intensity={4} distance={16} decay={2} />

      {/* Aros de energía que suben */}
      {[0.8, 1.4, 2].map((y, i) => (
        <mesh key={i} position={[0, y + 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.4 + i * 0.2, 0.03, 8, 64]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}
