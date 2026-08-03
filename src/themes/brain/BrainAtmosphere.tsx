import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

function NeuralParticles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 12 + Math.random() * 30
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 8
      arr[i * 3 + 2] = r * Math.cos(phi) - 8
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.02
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.03
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#c4b5fd" size={0.12} transparent opacity={0.6} sizeAttenuation />
    </points>
  )
}

function DataRings() {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.children.forEach((child, i) => {
      child.rotation.z = state.clock.elapsedTime * (0.1 + i * 0.05)
    })
  })

  return (
    <group ref={ref} position={[0, 5, -8]}>
      {[12, 18, 24].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.05, radius + 0.05, 128]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

export function BrainAtmosphere({ quality }: ThemeAtmosphereProps) {
  const analysis = useAudioStore((state) => state.analysis)
  const count = quality === 'high' ? 400 : quality === 'medium' ? 200 : 80

  return (
    <>
      <NeuralParticles count={count} />
      <DataRings />
      <pointLight position={[0, 12, 0]} intensity={analysis.average * 3} color="#ec4899" distance={80} decay={1} />
    </>
  )
}
