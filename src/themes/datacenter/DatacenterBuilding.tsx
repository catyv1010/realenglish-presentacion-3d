import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

/**
 * Racks de servidores: gabinetes oscuros con unidades apiladas y
 * LEDs de actividad que parpadean de forma independiente.
 */
export function DatacenterBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ledsRef = useRef<THREE.Group>(null)
  const [x, y, z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#0f172a'
  const delay = config.entranceDelay ?? 0
  const analysis = useAudioStore((state) => state.analysis)

  const units = useMemo(() => Math.max(3, Math.floor(h / 0.9)), [h])
  const ledPhases = useMemo(
    () => Array.from({ length: units }, () => Math.random() * Math.PI * 2),
    [units]
  )
  const ledSpeeds = useMemo(
    () => Array.from({ length: units }, () => 2 + Math.random() * 6),
    [units]
  )

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.scale,
      { y: 0.001 },
      { y: 1, duration: entranceDuration, delay, ease: 'elastic.out(1, 0.6)' }
    )
  }, [entranceDuration, delay])

  useFrame((state) => {
    if (!ledsRef.current) return
    const t = state.clock.elapsedTime
    ledsRef.current.children.forEach((led, i) => {
      const mesh = led as THREE.Mesh
      const mat = mesh.material as THREE.MeshBasicMaterial
      const on = Math.sin(t * ledSpeeds[i] + ledPhases[i]) + analysis.mid * 1.5 > 0.2
      mat.opacity = on ? 1 : 0.12
    })
  })

  return (
    <group ref={groupRef} position={[x, y + h / 2, z]}>
      {/* Gabinete */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.75} />
      </mesh>
      {/* Marco frontal */}
      <mesh position={[0, 0, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.94, h * 0.97]} />
        <meshStandardMaterial color="#020617" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Unidades y LEDs */}
      <group ref={ledsRef}>
        {Array.from({ length: units }).map((_, i) => (
          <mesh
            key={i}
            position={[
              -w * 0.28,
              -h / 2 + (i + 0.5) * (h / units),
              d / 2 + 0.03,
            ]}
          >
            <planeGeometry args={[0.14, 0.14]} />
            <meshBasicMaterial
              color={i % 3 === 0 ? '#22d3ee' : '#34d399'}
              transparent
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      {/* Ranuras de unidades */}
      {Array.from({ length: units }).map((_, i) => (
        <mesh
          key={`slot-${i}`}
          position={[w * 0.08, -h / 2 + (i + 0.5) * (h / units), d / 2 + 0.02]}
        >
          <planeGeometry args={[w * 0.55, 0.06]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
      ))}
      {config.label && (
        <Billboard position={[0, h / 2 + 0.8, 0]}>
          <Text
            fontSize={0.48}
            color="#d1fae5"
            outlineWidth={0.02}
            outlineColor="#022c22"
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
