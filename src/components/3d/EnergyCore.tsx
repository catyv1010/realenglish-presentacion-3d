import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh, PointLight } from 'three'

interface EnergyCoreProps {
  position: [number, number, number]
  color?: string
}

export function EnergyCore({ position, color = '#f59e0b' }: EnergyCoreProps) {
  const sphereRef = useRef<Mesh>(null)
  const lightRef = useRef<PointLight>(null)

  useFrame((state) => {
    const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.15 + 1
    if (sphereRef.current) {
      sphereRef.current.scale.setScalar(pulse)
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 3) * 0.5
    }
  })

  return (
    <group position={position}>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={4}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      <pointLight ref={lightRef} color={color} intensity={4} distance={20} />
      <mesh scale={2.2}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} />
      </mesh>
    </group>
  )
}
