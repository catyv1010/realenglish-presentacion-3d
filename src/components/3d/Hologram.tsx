import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'
import type { HologramConfig } from '../../types/presentation'

interface HologramProps {
  config: HologramConfig
}

export function Hologram({ config }: HologramProps) {
  const groupRef = useRef<Group>(null)
  const color = config.color ?? '#22d3ee'
  const [width, height] = config.size ?? [2, 1.2]
  const rotationSpeed = config.rotationSpeed ?? 0.5

  const edgesGeometry = useMemo(() => {
    const geometry = new THREE.BoxGeometry(width, height, 0.05)
    return new THREE.EdgesGeometry(geometry)
  }, [width, height])

  // Tamaño de letra que cabe en la caja: limitado por alto y por el largo del texto
  const contentFontSize = useMemo(() => {
    const text = config.content ?? 'DATA'
    const longest = Math.max(...text.split(/\s+/).map((word) => word.length), 4)
    const byHeight = height * 0.3
    const byWidth = (width * 0.85) / (longest * 0.62)
    return Math.max(0.18, Math.min(byHeight, byWidth))
  }, [config.content, width, height])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * rotationSpeed) * 0.3
    groupRef.current.position.y = config.position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.1
  })

  return (
    <group ref={groupRef} position={config.position}>
      {/* Hologram screen */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} side={2} />
      </mesh>

      {/* Scanlines */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[width * 0.95, height * 0.95]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Glowing border */}
      <lineSegments geometry={edgesGeometry}>
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>

      {/* Texto 3D centrado DENTRO de la pantalla del holograma */}
      <Text
        position={[0, 0, 0.04]}
        fontSize={contentFontSize}
        maxWidth={width * 0.88}
        lineHeight={1.15}
        textAlign="center"
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor={color}
      >
        {config.content ?? 'DATA'}
      </Text>
    </group>
  )
}
