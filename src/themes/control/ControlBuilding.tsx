import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

/**
 * Torres de monitoreo: prismas hexagonales con contorno luminoso y una
 * pantalla frontal con barras tipo gráfico que suben y bajan en vivo.
 */
export function ControlBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const barsRef = useRef<THREE.Group>(null)
  const [x, y, z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#0ea5e9'
  const delay = config.entranceDelay ?? 0
  const analysis = useAudioStore((state) => state.analysis)
  const radius = Math.max(w, d) * 0.55

  const barCount = 5
  const barPhases = useMemo(
    () => Array.from({ length: barCount }, () => Math.random() * Math.PI * 2),
    []
  )

  const hexGeometry = useMemo(() => new THREE.CylinderGeometry(radius, radius, h, 6), [radius, h])
  const edges = useMemo(() => new THREE.EdgesGeometry(hexGeometry), [hexGeometry])

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0.001, y: 0.001, z: 0.001 },
      { x: 1, y: 1, z: 1, duration: entranceDuration, delay, ease: 'back.out(1.4)' }
    )
  }, [entranceDuration, delay])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (barsRef.current) {
      barsRef.current.children.forEach((bar, i) => {
        const level = 0.25 + (Math.sin(t * 1.8 + barPhases[i]) * 0.5 + 0.5) * 0.75 + analysis.mid * 0.4
        bar.scale.y = Math.min(1.4, level)
      })
    }
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.08
    }
  })

  const screenW = radius * 1.15
  const screenH = h * 0.42

  return (
    <group ref={groupRef} position={[x, y + h / 2, z]}>
      {/* Prisma hexagonal */}
      <mesh castShadow receiveShadow geometry={hexGeometry}>
        <meshPhysicalMaterial
          color="#082f49"
          roughness={0.25}
          metalness={0.6}
          transmission={0.1}
          emissive={color}
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* Contorno luminoso */}
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={color} />
      </lineSegments>
      {/* Pantalla de métricas */}
      <group position={[0, h * 0.12, radius * 0.92]}>
        <mesh>
          <planeGeometry args={[screenW, screenH]} />
          <meshBasicMaterial color="#020617" transparent opacity={0.85} />
        </mesh>
        <group ref={barsRef} position={[0, -screenH / 2 + 0.05, 0.01]}>
          {Array.from({ length: barCount }).map((_, i) => (
            <mesh
              key={i}
              position={[-screenW / 2 + (i + 0.5) * (screenW / barCount), 0, 0]}
            >
              <planeGeometry args={[(screenW / barCount) * 0.55, screenH * 0.8]} />
              <meshBasicMaterial
                color={i === barCount - 1 ? '#f59e0b' : '#38bdf8'}
                toneMapped={false}
              />
            </mesh>
          ))}
        </group>
      </group>
      {config.label && (
        <Billboard position={[0, h / 2 + 0.85, 0]}>
          <Text
            fontSize={0.48}
            color="#e0f2fe"
            outlineWidth={0.02}
            outlineColor="#082f49"
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
