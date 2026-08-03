import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

/** Cruz médica emisiva que corona los edificios principales */
function MedicalCross({ size = 0.9 }: { size?: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    const pulse = 0.75 + Math.sin(state.clock.elapsedTime * 2.2) * 0.25
    ref.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh
      const mat = mesh.material as THREE.MeshBasicMaterial
      mat.opacity = pulse
    })
    ref.current.rotation.y = state.clock.elapsedTime * 0.6
  })
  const bar = size
  const thick = size * 0.32
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[bar, thick, thick]} />
        <meshBasicMaterial color="#ef4444" transparent />
      </mesh>
      <mesh>
        <boxGeometry args={[thick, bar, thick]} />
        <meshBasicMaterial color="#ef4444" transparent />
      </mesh>
    </group>
  )
}

export function HospitalBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [x, y, z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#e2e8f0'
  const delay = config.entranceDelay ?? 0
  const analysis = useAudioStore((state) => state.analysis)
  const isMain = (config.hasCore ?? false) || h >= 8

  const windows = useMemo(() => {
    const rows = Math.max(2, Math.floor(h / 1.2))
    const cols = Math.max(2, Math.floor(w / 0.8))
    const items: { pos: [number, number, number]; lit: boolean }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({
          pos: [
            -w / 2 + (c + 0.5) * (w / cols),
            -h / 2 + (r + 0.5) * (h / rows),
            d / 2 + 0.02,
          ],
          lit: Math.random() > 0.45,
        })
      }
    }
    return items
  }, [w, h, d])

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0.001, y: 0.001, z: 0.001 },
      { x: 1, y: 1, z: 1, duration: entranceDuration, delay, ease: 'power3.out' }
    )
  }, [entranceDuration, delay])

  useFrame(() => {
    if (!groupRef.current) return
    const pulse = 1 + analysis.bass * 0.05
    groupRef.current.scale.y = pulse
  })

  return (
    <group ref={groupRef} position={[x, y + h / 2, z]}>
      {/* Torre principal */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.35}
          metalness={0.25}
          emissive={color}
          emissiveIntensity={0.04}
        />
      </mesh>
      {/* Franja de identificación */}
      <mesh position={[0, h * 0.18, 0]}>
        <boxGeometry args={[w + 0.06, 0.25, d + 0.06]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      {/* Ventanas iluminadas */}
      {windows.map((win, i) =>
        win.lit ? (
          <mesh key={i} position={win.pos}>
            <planeGeometry args={[(w / 5) * 0.6, 0.4]} />
            <meshBasicMaterial color="#fef3c7" toneMapped={false} />
          </mesh>
        ) : null
      )}
      {/* Cruz médica en la azotea de los edificios principales */}
      {isMain && (
        <group position={[0, h / 2 + 0.9, 0]}>
          <MedicalCross size={Math.min(1.4, w * 0.5)} />
        </group>
      )}
      {config.label && (
        <Billboard position={[0, h / 2 + (isMain ? 2.1 : 0.8), 0]}>
          <Text
            fontSize={0.5}
            color="#e0f2fe"
            outlineWidth={0.02}
            outlineColor="#0c4a6e"
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
