import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

export function ForestBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const crystalRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  const [x, y, z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#10b981'
  const delay = config.entranceDelay ?? 0
  const analysis = useAudioStore((state) => state.analysis)

  const radius = Math.max(w, d) * 0.5
  const crystalHeight = h * 1.2
  const floatOffset = useMemo(() => Math.random() * Math.PI * 2, [])

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(radius * 0.2, radius * 0.7, crystalHeight, 8)
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      const v = new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2])
      const noise = Math.sin(v.y * 2 + x) * Math.cos(v.y * 3 + z) * 0.15
      v.x += noise
      v.z += noise
      pos[i] = v.x
      pos[i + 1] = v.y
      pos[i + 2] = v.z
    }
    geo.computeVertexNormals()
    return geo
  }, [radius, crystalHeight, x, z])

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.position,
      { y: -crystalHeight },
      { y: y + crystalHeight / 2, duration: entranceDuration * 1.4, delay, ease: 'power3.out' }
    )
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: entranceDuration, delay: delay + 0.1, ease: 'back.out(1.5)' }
    )
  }, [entranceDuration, delay, y, crystalHeight])

  useFrame((state) => {
    if (!groupRef.current) return
    const pulse = 1 + analysis.bass * 0.1
    groupRef.current.scale.x = pulse
    groupRef.current.scale.z = pulse

    const floatY = Math.sin(state.clock.elapsedTime * 1.2 + floatOffset) * 0.1
    groupRef.current.position.y = y + crystalHeight / 2 + floatY

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.2 + analysis.average * 0.35
    }
  })

  return (
    <group ref={groupRef} position={[x, y + crystalHeight / 2, z]}>
      {/* Cristal central */}
      <mesh ref={crystalRef} castShadow geometry={geometry}>
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
          roughness={0.1}
          metalness={0.1}
          transmission={0.4}
          transparent
          opacity={0.85}
          clearcoat={1}
        />
      </mesh>

      {/* Brillo exterior */}
      <mesh ref={glowRef} scale={1.3}>
        <cylinderGeometry args={[radius * 0.5, radius * 0.9, crystalHeight * 0.9, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {/* Aro de energía */}
      <mesh position={[0, crystalHeight * 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.9, 0.04, 8, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>

      {/* Etiqueta */}
      {config.label && (
        <Billboard position={[0, crystalHeight * 0.6 + 0.7, 0]}>
          <Text fontSize={0.45} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.03} outlineColor="#000000">
            {config.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
