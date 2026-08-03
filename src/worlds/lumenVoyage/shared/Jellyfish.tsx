import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface JellyfishProps {
  position: [number, number, number]
  scale?: number
  color?: string
  pulseSpeed?: number
  driftSpeed?: number
}

export function Jellyfish({ position, scale = 1, color = '#8b5cf6', pulseSpeed = 1, driftSpeed = 0.5 }: JellyfishProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const tentaclesRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const tentacleCount = 8
  const tentacleSegments = 12

  useFrame((state) => {
    if (!groupRef.current || !bodyRef.current || !tentaclesRef.current) return
    const t = state.clock.elapsedTime

    // Flotación vertical y horizontal
    groupRef.current.position.x = position[0] + Math.sin(t * driftSpeed) * 0.8
    groupRef.current.position.y = position[1] + Math.sin(t * driftSpeed * 0.7 + 1) * 0.5
    groupRef.current.position.z = position[2] + Math.cos(t * driftSpeed * 0.6) * 0.8

    // Pulsación del cuerpo
    const pulse = 1 + Math.sin(t * pulseSpeed * 2) * 0.1
    bodyRef.current.scale.set(pulse, 1 / pulse, pulse)

    // Movimiento de tentáculos
    for (let i = 0; i < tentacleCount; i++) {
      const angle = (i / tentacleCount) * Math.PI * 2
      const baseX = Math.cos(angle) * 0.25
      const baseZ = Math.sin(angle) * 0.25
      for (let j = 0; j < tentacleSegments; j++) {
        const segT = j / tentacleSegments
        const wave = Math.sin(t * pulseSpeed * 3 + segT * 4 + angle * 2) * 0.12 * segT
        dummy.position.set(baseX + wave, -0.3 - segT * 1.2, baseZ + wave * 0.5)
        dummy.scale.set(0.04 * (1 - segT * 0.5), 0.12, 0.04 * (1 - segT * 0.5))
        dummy.updateMatrix()
        tentaclesRef.current.setMatrixAt(i * tentacleSegments + j, dummy.matrix)
      }
    }
    tentaclesRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <pointLight color={color} intensity={1.5} distance={4} decay={2} />
      {/* Cúpula */}
      <mesh ref={bodyRef}>
        <sphereGeometry args={[0.45, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.6}
          roughness={0.2}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Tentáculos instanciados */}
      <instancedMesh ref={tentaclesRef} args={[undefined, undefined, tentacleCount * tentacleSegments]}>
        <capsuleGeometry args={[1, 1, 4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.5} />
      </instancedMesh>
    </group>
  )
}
