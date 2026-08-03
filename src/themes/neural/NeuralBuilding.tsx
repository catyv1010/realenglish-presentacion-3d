import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

export function NeuralBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [x, y, z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#7c3aed'
  const delay = config.entranceDelay ?? 0
  const analysis = useAudioStore((state) => state.analysis)

  const rings = useMemo(() => Math.max(3, Math.floor(h / 1.5)), [h])

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
    const pulse = 1 + analysis.bass * 0.08
    groupRef.current.scale.x = pulse
    groupRef.current.scale.z = pulse
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.05
  })

  return (
    <group ref={groupRef} position={[x, y + h / 2, z]}>
      <mesh castShadow>
        <cylinderGeometry args={[w * 0.5, d * 0.5, h, 16]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.15}
          roughness={0.2}
          metalness={0.5}
          transmission={0.15}
          transparent
          opacity={0.85}
        />
      </mesh>

      {Array.from({ length: rings }).map((_, i) => (
        <mesh
          key={i}
          position={[0, -h / 2 + (i + 1) * (h / (rings + 1)), 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[w * 0.6 + i * 0.1, 0.04, 8, 32]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      ))}

      {config.label && (
        <Billboard position={[0, h / 2 + 0.8, 0]}>
          <Text fontSize={0.45} color="#ffffff" anchorX="center" anchorY="middle">
            {config.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
