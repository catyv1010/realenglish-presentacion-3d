import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

/**
 * Los "edificios" de la bóveda son cilindros acorazados con anillos de
 * cerradura que giran, como los diales de una caja fuerte.
 */
export function VaultBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ringsRef = useRef<THREE.Group>(null)
  const [x, y, z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#f59e0b'
  const delay = config.entranceDelay ?? 0
  const analysis = useAudioStore((state) => state.analysis)
  const radius = Math.max(w, d) * 0.5

  const rings = useMemo(() => Math.max(2, Math.floor(h / 2.2)), [h])
  const ringSpeeds = useMemo(
    () => Array.from({ length: rings }, (_, i) => (i % 2 === 0 ? 0.4 : -0.3) * (1 + i * 0.15)),
    [rings]
  )

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.position,
      { y: y - h },
      { y: y + h / 2, duration: entranceDuration * 1.1, delay, ease: 'power4.out' }
    )
  }, [entranceDuration, delay, y, h])

  useFrame((_, delta) => {
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        ring.rotation.y += delta * ringSpeeds[i] * (1 + analysis.high)
      })
    }
    if (groupRef.current) {
      const s = 1 + analysis.bass * 0.04
      groupRef.current.scale.set(s, 1, s)
    }
  })

  return (
    <group ref={groupRef} position={[x, y + h / 2, z]}>
      {/* Cuerpo acorazado */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius * 1.08, h, 24]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.65}
          emissive={color}
          emissiveIntensity={0.18}
        />
      </mesh>
      {/* Remaches superiores */}
      <mesh position={[0, h / 2 + 0.08, 0]}>
        <cylinderGeometry args={[radius * 0.85, radius * 0.85, 0.16, 24]} />
        <meshStandardMaterial color="#78350f" roughness={0.4} metalness={0.9} />
      </mesh>
      {/* Diales giratorios */}
      <group ref={ringsRef}>
        {Array.from({ length: rings }).map((_, i) => (
          <group key={i} position={[0, -h / 2 + (i + 1) * (h / (rings + 1)), 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[radius + 0.14, 0.07, 10, 40]} />
              <meshStandardMaterial
                color="#fde68a"
                emissive="#f59e0b"
                emissiveIntensity={0.5}
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
            {/* Muescas del dial */}
            {Array.from({ length: 6 }).map((_, j) => {
              const a = (j / 6) * Math.PI * 2
              return (
                <mesh key={j} position={[Math.cos(a) * (radius + 0.14), 0, Math.sin(a) * (radius + 0.14)]}>
                  <boxGeometry args={[0.12, 0.22, 0.12]} />
                  <meshBasicMaterial color="#fbbf24" />
                </mesh>
              )
            })}
          </group>
        ))}
      </group>
      {config.label && (
        <Billboard position={[0, h / 2 + 1, 0]}>
          <Text
            fontSize={0.5}
            color="#fef3c7"
            outlineWidth={0.02}
            outlineColor="#451a03"
            anchorX="center"
            anchorY="middle"
          >
            {config.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
