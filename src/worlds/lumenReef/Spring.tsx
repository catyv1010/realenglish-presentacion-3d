import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { QualityLevel } from '../../types/presentation'

interface SpringProps {
  label: string
  description: string
  position: [number, number, number]
  color: string
  accent: string
  quality: QualityLevel
  type?: 'citas' | 'profesionales' | 'productos' | 'contable'
}

function SpringParticles({ color, quality, active }: { color: string; quality: QualityLevel; active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = quality === 'low' ? 36 : quality === 'medium' ? 64 : 100

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: Math.random() * Math.PI * 2,
      radius: 0.2 + Math.random() * 0.4,
      speed: 0.6 + Math.random() * 1.2,
      scale: 0.06 + Math.random() * 0.07,
      phase: Math.random() * Math.PI * 2,
    }))
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    const intensity = active ? 1.4 : 1.0
    particles.forEach((p) => {
      const y = ((t * p.speed + p.phase) % 3.5) * intensity
      const r = p.radius * (1 - y / 4)
      const x = Math.cos(p.angle + t * 0.5) * r
      const z = Math.sin(p.angle + t * 0.5) * r
      dummy.position.set(x, y, z)
      const s = p.scale * (1 - y / 5) * intensity
      dummy.scale.setScalar(Math.max(0.01, s))
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(p.id, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.5} toneMapped={false} />
    </instancedMesh>
  )
}

export function Spring({ label, description, position, color, accent, quality, type = 'citas' }: SpringProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const [activated, setActivated] = useState(false)

  const shapeScale = useMemo<[number, number, number]>(() => {
    switch (type) {
      case 'profesionales':
        return [0.9, 1.3, 0.9]
      case 'productos':
        return [1.1, 0.9, 1.1]
      case 'contable':
        return [0.85, 1.1, 0.85]
      default:
        return [0.95, 1.2, 0.95]
    }
  }, [type])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.position.y = position[1] + Math.sin(t * 0.7 + position[0]) * 0.04
    groupRef.current.scale.setScalar(1 + (hovered || activated ? 0.05 : 0))
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Base de coral */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)} onClick={() => setActivated(!activated)}>
        <cylinderGeometry args={[1.4, 1.8, 0.8, 32]} />
        <meshStandardMaterial color={accent} roughness={0.8} metalness={0.1} emissive={color} emissiveIntensity={hovered || activated ? 0.65 : 0.35} />
      </mesh>

      {/* Chimenea del manantial */}
      <mesh position={[0, 1.0, 0]} scale={shapeScale} castShadow>
        <tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.8, 0), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(-0.1, 0.8, 0), new THREE.Vector3(0, 1.4, 0)]), 24, 0.7, 16, false]} />
        <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} emissive={color} emissiveIntensity={0.45} />
      </mesh>

      {/* Agua brillante en la boca */}
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.55, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={hovered || activated ? 3.5 : 2.2} toneMapped={false} />
      </mesh>

      <SpringParticles color={color} quality={quality} active={hovered || activated} />

      <pointLight position={[0, 2.2, 0]} color={color} intensity={hovered || activated ? 7 : 4.5} distance={14} decay={2} />

      {/* Etiqueta */}
      <Billboard position={[0, 3.4, 0]}>
        <Text fontSize={0.26} color="#f8fafc" anchorX="center" anchorY="middle" letterSpacing={0.02}>
          {label}
        </Text>
        <Text fontSize={0.14} color={color} anchorX="center" anchorY="middle" position={[0, -0.38, 0]}>
          Fuente interna
        </Text>
      </Billboard>

      {/* Tooltip descriptivo al hover */}
      {(hovered || activated) && (
        <Billboard position={[0, 4.3, 0]}>
          <mesh>
            <planeGeometry args={[4.6, 1.4]} />
            <meshBasicMaterial color="#020617" transparent opacity={0.9} />
          </mesh>
          <Text fontSize={0.13} color="#e2e8f0" anchorX="center" anchorY="middle" maxWidth={3.8} textAlign="center">
            {description}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
