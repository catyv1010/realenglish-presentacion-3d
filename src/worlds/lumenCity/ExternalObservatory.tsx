import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

interface ExternalObservatoryProps {
  label: string
  position: [number, number, number]
  color?: string
  beamColor?: string
}

export function ExternalObservatory({ label, position, color = '#10b981', beamColor = '#34d399' }: ExternalObservatoryProps) {
  const beamRef = useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>(null)

  useFrame((state) => {
    if (beamRef.current) {
      beamRef.current.material.opacity = 0.25 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1
    }
  })

  return (
    <group position={position}>
      {/* Plataforma */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[1.8, 2, 0.3, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Cúpula */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[1.2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.2}
          roughness={0.1}
          transmission={0.4}
          thickness={0.8}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Telescopio / transmisor */}
      <mesh position={[0, 2.1, 0]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 1.2, 16]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.75, 0.25]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={beamColor} emissive={beamColor} emissiveIntensity={1.5} toneMapped={false} />
      </mesh>

      {/* Haz de datos */}
      <mesh ref={beamRef} position={[0, 6.5, 0]}>
        <cylinderGeometry args={[0.08, 0.35, 8, 16]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <pointLight position={[0, 3, 0]} color={beamColor} intensity={2.5} distance={10} decay={2} />

      {/* Etiqueta */}
      <Billboard position={[0, 3.4, 0]}>
        <Text fontSize={0.24} color="#f1f5f9" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </Billboard>
      <Billboard position={[0, 3.05, 0]}>
        <Text fontSize={0.14} color={color} anchorX="center" anchorY="middle">
          Fuente externa
        </Text>
      </Billboard>
    </group>
  )
}
