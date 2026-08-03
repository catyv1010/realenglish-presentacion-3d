import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import gsap from 'gsap'
import type { Group, Mesh } from 'three'
import type { BuildingConfig } from '../../types/presentation'
import { useAudioStore } from '../../store/useAudioStore'

interface BuildingProps {
  config: BuildingConfig
  entranceDuration?: number
}

export function Building({ config, entranceDuration = 1 }: BuildingProps) {
  const groupRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const floorsRef = useRef<Group>(null)
  const [x, y, z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#1e3a8a'
  const windowColor = config.windowColor ?? '#06b6d4'
  const isTransparent = config.transparent ?? false
  const delay = config.entranceDelay ?? 0

  const floorCount = useMemo(() => Math.max(3, Math.floor(h / 0.8)), [h])
  const floorHeight = h / floorCount
  const bass = useAudioStore((state) => state.analysis.bass)

  useLayoutEffect(() => {
    if (!groupRef.current || !floorsRef.current) return

    gsap.fromTo(
      groupRef.current.position,
      { y: y + h / 2 + 5 },
      {
        y: y + h / 2,
        duration: entranceDuration * 1.2,
        delay,
        ease: 'power3.out',
      }
    )

    const floors = floorsRef.current.children
    gsap.fromTo(
      floors.map((floor) => floor.scale),
      { y: 0 },
      {
        y: 1,
        duration: entranceDuration * 0.6,
        delay: delay + 0.2,
        stagger: 0.08,
        ease: 'back.out(1.7)',
      }
    )
  }, [entranceDuration, delay, y, h])

  useFrame((state) => {
    if (meshRef.current && config.transparent) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05
    }
    if (groupRef.current) {
      const pulse = 1 + bass * 0.03
      groupRef.current.scale.x = pulse
      groupRef.current.scale.z = pulse
    }
  })

  return (
    <group ref={groupRef} position={[x, y + h / 2, z]}>
      {/* Core structure */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={[w * 0.95, h, d * 0.95]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.6}
          transparent={isTransparent}
          opacity={isTransparent ? 0.2 : 1}
        />
      </mesh>

      {/* Floors assembly */}
      <group ref={floorsRef}>
        {Array.from({ length: floorCount }).map((_, index) => (
          <mesh
            key={index}
            position={[0, -h / 2 + index * floorHeight + floorHeight / 2, 0]}
            scale={[1, 0, 1]}
          >
            <boxGeometry args={[w, floorHeight * 0.85, d]} />
            <meshStandardMaterial
              color={color}
              emissive={windowColor}
              emissiveIntensity={0.5}
              roughness={0.1}
              metalness={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* Windows strip */}
      <mesh position={[0, 0, d / 2 + 0.03]}>
        <planeGeometry args={[w * 0.7, h * 0.9]} />
        <meshBasicMaterial color={windowColor} transparent opacity={0.3} />
      </mesh>

      {/* Glow base */}
      <mesh position={[0, -h / 2 + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 1.8, d * 1.8]} />
        <meshBasicMaterial color={windowColor} transparent opacity={0.4} />
      </mesh>

      {config.label && (
        <Text
          position={[0, h / 2 + 0.8, 0]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {config.label}
        </Text>
      )}
    </group>
  )
}
