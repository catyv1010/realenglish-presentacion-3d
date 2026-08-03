import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

const NEON_COLORS = ['#06b6d4', '#ec4899', '#8b5cf6', '#facc15', '#22d3ee', '#f43f5e']

function pickColor(seed: string, palette: string[]) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

export function CyberpunkBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const windowsRef = useRef<THREE.Group>(null)
  const antennaRef = useRef<THREE.Group>(null)
  const labelRef = useRef<THREE.Group>(null)

  const [x, y, z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#1e293b'
  const windowColor = config.windowColor ?? pickColor(config.id, NEON_COLORS)
  const isTransparent = config.transparent ?? false
  const delay = config.entranceDelay ?? 0

  const analysis = useAudioStore((state) => state.analysis)

  const floorCount = useMemo(() => Math.max(4, Math.floor(h / 0.7)), [h])
  const floorHeight = h / floorCount

  const windowPattern = useMemo(() => {
    return Array.from({ length: floorCount }).map((_, i) => ({
      on: Math.random() > 0.25,
      intensity: 0.4 + Math.random() * 0.8,
      reactive: Math.random() > 0.6,
      offset: i * 0.2,
    }))
  }, [floorCount])

  useLayoutEffect(() => {
    if (!groupRef.current || !windowsRef.current || !antennaRef.current || !labelRef.current) return

    gsap.fromTo(
      groupRef.current.position,
      { y: y + h / 2 + 8 },
      {
        y: y + h / 2,
        duration: entranceDuration * 1.3,
        delay,
        ease: 'power3.out',
      }
    )

    gsap.fromTo(
      groupRef.current.scale,
      { x: 0.1, y: 0.1, z: 0.1 },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: entranceDuration * 0.8,
        delay: delay + 0.1,
        ease: 'back.out(1.2)',
      }
    )

    const floors = windowsRef.current.children
    gsap.fromTo(
      floors.map((floor) => floor.scale),
      { y: 0 },
      {
        y: 1,
        duration: entranceDuration * 0.5,
        delay: delay + 0.2,
        stagger: 0.06,
        ease: 'back.out(1.4)',
      }
    )

    gsap.fromTo(
      antennaRef.current.position,
      { y: h / 2 },
      {
        y: h / 2 + 1.5,
        duration: entranceDuration * 0.6,
        delay: delay + 0.4,
        ease: 'elastic.out(1, 0.5)',
      }
    )
  }, [entranceDuration, delay, y, h])

  useFrame((state) => {
    if (!groupRef.current) return
    const bassPulse = 1 + analysis.bass * 0.04
    groupRef.current.scale.x = bassPulse
    groupRef.current.scale.z = bassPulse

    if (bodyRef.current && isTransparent) {
      bodyRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.03
    }

    if (windowsRef.current) {
      const time = state.clock.elapsedTime
      windowsRef.current.children.forEach((floor, i) => {
        const pattern = windowPattern[i]
        if (!pattern) return
        const mat = (floor as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (pattern.reactive) {
          const beat = Math.sin(time * 3 + pattern.offset) * 0.5 + 0.5
          mat.emissiveIntensity = pattern.intensity * (0.5 + beat * 0.5 + analysis.average * 0.8)
        } else {
          mat.emissiveIntensity = pattern.intensity * (0.6 + analysis.average * 0.4)
        }
      })
    }

    if (antennaRef.current) {
      const light = antennaRef.current.children[1] as THREE.Mesh | undefined
      if (light) {
        const mat = light.material as THREE.MeshBasicMaterial
        mat.color.setHSL(0, 0, 0.5 + analysis.high * 0.5)
      }
    }
  })

  return (
    <group ref={groupRef} position={[x, y + h / 2, z]}>
      {/* Base platform */}
      <mesh position={[0, -h / 2 + 0.1, 0]} receiveShadow>
        <boxGeometry args={[w * 1.6, 0.2, d * 1.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Glow base */}
      <mesh position={[0, -h / 2 + 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 2, d * 2]} />
        <meshBasicMaterial color={windowColor} transparent opacity={0.25} />
      </mesh>

      {/* Main structure */}
      <mesh ref={bodyRef} castShadow receiveShadow>
        <boxGeometry args={[w * 0.92, h * 0.95, d * 0.92]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.08}
          roughness={0.25}
          metalness={0.7}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
          transparent={isTransparent}
          opacity={isTransparent ? 0.18 : 1}
          transmission={isTransparent ? 0.25 : 0}
        />
      </mesh>

      {/* Window floors */}
      <group ref={windowsRef}>
        {Array.from({ length: floorCount }).map((_, index) => {
          const pattern = windowPattern[index]
          if (!pattern?.on) return null
          return (
            <mesh
              key={index}
              position={[0, -h / 2 + index * floorHeight + floorHeight / 2, d / 2 + 0.02]}
              scale={[1, 0, 1]}
            >
              <boxGeometry args={[w * 0.75, floorHeight * 0.65, 0.05]} />
              <meshStandardMaterial
                color={windowColor}
                emissive={windowColor}
                emissiveIntensity={pattern.intensity}
                roughness={0.1}
                metalness={0.9}
              />
            </mesh>
          )
        })}
      </group>

      {/* Side neon strip */}
      <mesh position={[w / 2 + 0.02, 0, d / 2 + 0.02]}>
        <boxGeometry args={[0.04, h * 0.9, 0.04]} />
        <meshBasicMaterial color={windowColor} />
      </mesh>
      <mesh position={[-w / 2 - 0.02, 0, -d / 2 - 0.02]}>
        <boxGeometry args={[0.04, h * 0.9, 0.04]} />
        <meshBasicMaterial color={windowColor} />
      </mesh>

      {/* Antenna */}
      <group ref={antennaRef} position={[0, h / 2, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.02, 0.02, 1.5, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Label */}
      {config.label && (
        <group ref={labelRef} position={[0, h / 2 + 1.2, 0]}>
          <Text
            fontSize={0.45}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#000000"
          >
            {config.label}
          </Text>
          <mesh position={[0, -0.5, 0]}>
            <planeGeometry args={[2.2, 0.6]} />
            <meshBasicMaterial color={windowColor} transparent opacity={0.15} />
          </mesh>
        </group>
      )}
    </group>
  )
}
