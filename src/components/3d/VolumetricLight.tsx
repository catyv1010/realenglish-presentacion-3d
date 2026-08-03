import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

interface VolumetricLightProps {
  position: [number, number, number]
  color?: string
  height?: number
  radius?: number
}

export function VolumetricLight({
  position,
  color = '#facc15',
  height = 15,
  radius = 3,
}: VolumetricLightProps) {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.05
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05
    meshRef.current.scale.setScalar(pulse)
  })

  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[radius, height, 32, 1, true]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.06}
        side={2}
        depthWrite={false}
      />
    </mesh>
  )
}
