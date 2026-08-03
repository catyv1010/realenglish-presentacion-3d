import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

export function MindBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const ringsRef = useRef<THREE.Group>(null)

  const [x, y, z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#8b5cf6'
  const delay = config.entranceDelay ?? 0
  const analysis = useAudioStore((state) => state.analysis)

  // Forma orgánica: altura ligeramente mayor que ancho, como un lóbulo cerebral
  const radius = Math.max(w, d) * 0.55
  const coreHeight = h * 1.1

  const synapseRings = useMemo(() => Math.max(2, Math.floor(h / 2.5)), [h])

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.position,
      { y: y + h / 2 + 6 },
      { y: y + h / 2, duration: entranceDuration * 1.2, delay, ease: 'power3.out' }
    )
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: entranceDuration * 0.9, delay: delay + 0.1, ease: 'back.out(1.4)' }
    )

    if (ringsRef.current) {
      gsap.fromTo(
        ringsRef.current.children.map((c) => c.scale),
        { x: 0, y: 0, z: 0 },
        {
          x: 1,
          y: 1,
          z: 1,
          duration: entranceDuration * 0.6,
          delay: delay + 0.25,
          stagger: 0.08,
          ease: 'back.out(2)',
        }
      )
    }
  }, [entranceDuration, delay, y, h])

  useFrame((state) => {
    if (!groupRef.current) return
    const pulse = 1 + analysis.bass * 0.1
    groupRef.current.scale.x = pulse
    groupRef.current.scale.z = pulse
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.03

    if (coreRef.current) {
      const mat = coreRef.current.material as THREE.MeshPhysicalMaterial
      mat.emissiveIntensity = 0.12 + analysis.average * 0.35
    }
  })

  return (
    <group ref={groupRef} position={[x, y + h / 2, z]}>
      {/* Núcleo cerebral: cápsula orgánica */}
      <mesh ref={coreRef} castShadow>
        <capsuleGeometry args={[radius * 0.85, coreHeight * 0.7, 8, 16]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.12}
          roughness={0.25}
          metalness={0.2}
          transmission={0.2}
          transparent
          opacity={0.88}
          clearcoat={0.5}
          clearcoatRoughness={0.15}
        />
      </mesh>

      {/* Capa exterior holográfica */}
      <mesh scale={[1.15, 1.08, 1.15]}>
        <capsuleGeometry args={[radius * 0.85, coreHeight * 0.7, 8, 16]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.25}
          roughness={0.1}
          metalness={0.1}
          transmission={0.55}
          transparent
          opacity={0.18}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Anillos de sinapsis */}
      <group ref={ringsRef}>
        {Array.from({ length: synapseRings }).map((_, i) => {
          const t = (i + 1) / (synapseRings + 1)
          const ringRadius = radius * (1 + t * 0.7)
          const ringY = -coreHeight * 0.3 + t * coreHeight * 0.6
          return (
            <mesh key={i} position={[0, ringY, 0]} rotation={[Math.PI / 2, 0, 0]} scale={0}>
              <torusGeometry args={[ringRadius, 0.035, 8, 48]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
            </mesh>
          )
        })}
      </group>

      {/* Líneas de pulso vertical */}
      <mesh position={[radius * 0.9, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, coreHeight * 0.8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>
      <mesh position={[-radius * 0.9, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, coreHeight * 0.8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} />
      </mesh>

      {/* Etiqueta */}
      {config.label && (
        <Billboard position={[0, coreHeight * 0.55 + 0.7, 0]}>
          <Text fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="#000000">
            {config.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
