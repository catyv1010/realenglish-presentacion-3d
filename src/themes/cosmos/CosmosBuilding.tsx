import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

export function CosmosBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [x, y, z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#f59e0b'
  const delay = config.entranceDelay ?? 0
  const analysis = useAudioStore((state) => state.analysis)

  const orbitCount = useMemo(() => Math.max(2, Math.floor(h / 3)), [h])

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.position,
      { y: y + h / 2 + 5 },
      { y: y + h / 2, duration: entranceDuration * 1.2, delay, ease: 'power3.out' }
    )
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: entranceDuration * 0.8, delay: delay + 0.1, ease: 'back.out(1.5)' }
    )
  }, [entranceDuration, delay, y, h])

  useFrame((state) => {
    if (!groupRef.current) return
    const pulse = 1 + analysis.bass * 0.1
    groupRef.current.scale.setScalar(pulse)
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.08
  })

  return (
    <group ref={groupRef} position={[x, y + h / 2, z]}>
      <mesh castShadow>
        <icosahedronGeometry args={[Math.max(w, d) * 0.6, 1]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
          roughness={0.1}
          metalness={0.3}
          transmission={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>

      {Array.from({ length: orbitCount }).map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, i * 0.8, 0]}>
          <torusGeometry args={[w * 0.8 + i * 0.4, 0.03, 8, 48]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
        </mesh>
      ))}

      {config.label && (
        <Billboard position={[0, h / 2 + 1, 0]}>
          <Text fontSize={0.45} color="#ffffff" anchorX="center" anchorY="middle">
            {config.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
