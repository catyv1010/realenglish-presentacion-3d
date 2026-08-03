import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

export function BrainBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  const [x, y, z] = config.position
  const [w, _h, d] = config.size
  const color = config.color ?? '#8b5cf6'
  const delay = config.entranceDelay ?? 0
  const analysis = useAudioStore((state) => state.analysis)

  const radius = Math.max(w, d) * 0.5
  const floatOffset = useMemo(() => Math.random() * Math.PI * 2, [])

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.position,
      { y: y + 2 },
      { y, duration: entranceDuration * 1.2, delay, ease: 'power3.out' }
    )
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: entranceDuration * 0.9, delay: delay + 0.1, ease: 'back.out(1.7)' }
    )
  }, [entranceDuration, delay, y])

  useFrame((state) => {
    if (!groupRef.current) return
    const pulse = 1 + analysis.bass * 0.12
    groupRef.current.scale.setScalar(pulse)

    const floatY = Math.sin(state.clock.elapsedTime * 1.5 + floatOffset) * 0.15
    groupRef.current.position.y = y + floatY

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.25 + analysis.average * 0.3
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = state.clock.elapsedTime * 0.5
      ringRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <group ref={groupRef} position={[x, y, z]}>
      {/* Núcleo brillante */}
      <mesh ref={coreRef} castShadow>
        <sphereGeometry args={[radius * 0.6, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.3}
          transmission={0.2}
          transparent
          opacity={0.9}
          clearcoat={1}
        />
      </mesh>

      {/* Aura exterior */}
      <mesh ref={glowRef} scale={1.6}>
        <sphereGeometry args={[radius * 0.6, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>

      {/* Anillo orbitando */}
      <mesh ref={ringRef} scale={2.2}>
        <torusGeometry args={[radius * 0.5, 0.025, 8, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>

      {/* Conexión visual hacia el cerebro central */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, 0, -x * 0.3, 5 - y, -8 - z]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.3} />
      </line>

      {/* Etiqueta */}
      {config.label && (
        <Billboard position={[0, radius * 1.4, 0]}>
          <Text fontSize={0.45} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000000">
            {config.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
