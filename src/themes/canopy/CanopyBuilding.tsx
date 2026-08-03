import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

/**
 * Estación de canopy: un árbol con plataforma de madera, cabaña con techo
 * de paja que brilla en el color de la estación, farol y rótulo colgante.
 * La altura (size[1]) es la altura de la plataforma.
 */
export function CanopyBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const lanternRef = useRef<THREE.PointLight>(null)
  const flameRef = useRef<THREE.Mesh>(null)

  const [x, , z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#34d399'
  const delay = config.entranceDelay ?? 0
  const bass = useAudioStore((state) => state.analysis.bass)
  const flicker = useMemo(() => Math.random() * Math.PI * 2, [])

  const platformR = Math.max(w, d) * 0.85
  const woodDark = '#3d2b1a'
  const woodLight = '#6b4a2b'

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0.01, y: 0.01, z: 0.01 },
      { x: 1, y: 1, z: 1, duration: entranceDuration * 1.1, delay, ease: 'back.out(1.4)' }
    )
  }, [entranceDuration, delay])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const glow = 0.85 + Math.sin(t * 2.2 + flicker) * 0.15 + bass * 0.4
    if (lanternRef.current) lanternRef.current.intensity = 1.1 * glow
    if (flameRef.current) {
      const mat = flameRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.75 + Math.sin(t * 3.1 + flicker) * 0.2
    }
  })

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      {/* Tronco de la estación */}
      <mesh position={[0, (h + 2.4) / 2, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.72, h + 2.4, 8]} />
        <meshStandardMaterial color={woodDark} roughness={0.95} />
      </mesh>

      {/* Copa sobre la cabaña */}
      <mesh position={[0, h + 3.4, 0]} castShadow>
        <icosahedronGeometry args={[platformR * 1.15, 1]} />
        <meshStandardMaterial color="#0d4030" emissive={color} emissiveIntensity={0.08} roughness={0.85} />
      </mesh>
      <mesh position={[platformR * 0.7, h + 2.7, platformR * 0.3]}>
        <icosahedronGeometry args={[platformR * 0.55, 1]} />
        <meshStandardMaterial color="#0a3325" emissive={color} emissiveIntensity={0.06} roughness={0.85} />
      </mesh>

      {/* Plataforma de madera */}
      <mesh position={[0, h, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[platformR, platformR * 0.92, 0.22, 12]} />
        <meshStandardMaterial color={woodLight} roughness={0.9} />
      </mesh>
      {/* Baranda */}
      <mesh position={[0, h + 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[platformR * 0.96, 0.045, 6, 24]} />
        <meshStandardMaterial color={woodLight} roughness={0.85} />
      </mesh>
      {[...Array(8)].map((_, i) => (
        <mesh
          key={`post-${i}`}
          position={[Math.cos((i / 8) * Math.PI * 2) * platformR * 0.96, h + 0.3, Math.sin((i / 8) * Math.PI * 2) * platformR * 0.96]}
        >
          <cylinderGeometry args={[0.035, 0.035, 0.55, 5]} />
          <meshStandardMaterial color={woodDark} roughness={0.9} />
        </mesh>
      ))}

      {/* Cabaña */}
      <mesh position={[0, h + 0.75, 0]} castShadow>
        <boxGeometry args={[w * 0.78, 1.05, d * 0.78]} />
        <meshStandardMaterial color="#4a3520" roughness={0.9} />
      </mesh>
      {/* Ventana iluminada */}
      <mesh position={[0, h + 0.75, (d * 0.78) / 2 + 0.02]}>
        <planeGeometry args={[w * 0.3, 0.42]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
      {/* Techo de paja con el color de la estación */}
      <mesh position={[0, h + 1.75, 0]} castShadow>
        <coneGeometry args={[w * 0.75, 1.05, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.6} />
      </mesh>

      {/* Farol colgante */}
      <mesh position={[platformR * 0.8, h - 0.5, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1, 4]} />
        <meshBasicMaterial color={woodDark} />
      </mesh>
      <mesh ref={flameRef} position={[platformR * 0.8, h - 1.05, 0]}>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.9} />
      </mesh>
      <pointLight ref={lanternRef} position={[platformR * 0.8, h - 1.05, 0]} color="#fcd34d" intensity={1.1} distance={11} decay={2} />

      {/* Resplandor al pie del árbol */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[platformR * 1.3, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Rótulo de la estación */}
      {config.label && (
        <Billboard position={[0, h + 4.9, 0]}>
          <Text
            fontSize={0.52}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#04121a"
          >
            {config.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
