import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

function Fireflies({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const velocities = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      radius: 5 + Math.random() * 35,
      yBase: 1 + Math.random() * 18,
    }))
  }, [count])

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const v = velocities[i]
      if (!v) continue
      const a = Math.random() * Math.PI * 2
      arr[i * 3] = Math.cos(a) * v.radius
      arr[i * 3 + 1] = v.yBase
      arr[i * 3 + 2] = Math.sin(a) * v.radius
    }
    return arr
  }, [count, velocities])

  useFrame((state) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const v = velocities[i]
      if (!v) continue
      const a = time * v.speed * 0.15 + v.phase
      pos[i * 3] = Math.cos(a) * v.radius + Math.sin(time * 0.3 + v.phase) * 1.5
      pos[i * 3 + 1] = v.yBase + Math.sin(time * 0.5 + v.phase * 1.3) * 1.2
      pos[i * 3 + 2] = Math.sin(a) * v.radius + Math.cos(time * 0.25 + v.phase) * 1.5
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#facc15" size={0.28} transparent opacity={0.9} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function Pollen({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 80
      arr[i * 3 + 1] = Math.random() * 28
      arr[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.008
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.02
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#a7f3d0" size={0.08} transparent opacity={0.35} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function GodRays() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.015
  })
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 14, 0]} rotation={[0, (i / 4) * Math.PI, 0]}>
          <coneGeometry args={[4 + i * 1.2, 28, 32, 1, true]} />
          <meshBasicMaterial color={i % 2 === 0 ? '#10b981' : '#8b5cf6'} transparent opacity={0.035} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function FloatingSpores({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 50
      arr[i * 3 + 1] = 0.5 + Math.random() * 6
      arr[i * 3 + 2] = (Math.random() - 0.5) * 50
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(time + i) * 0.003
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#5eead4" size={0.12} transparent opacity={0.5} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

export function ForestAtmosphere({ quality }: ThemeAtmosphereProps) {
  const analysis = useAudioStore((state) => state.analysis)
  const fireflyCount = quality === 'high' ? 350 : quality === 'medium' ? 180 : 80
  const pollenCount = quality === 'high' ? 700 : quality === 'medium' ? 350 : 150
  const sporeCount = quality === 'high' ? 200 : quality === 'medium' ? 100 : 40

  return (
    <>
      <GodRays />
      <Fireflies count={fireflyCount} />
      <Pollen count={pollenCount} />
      <FloatingSpores count={sporeCount} />
      <pointLight position={[0, 12, 0]} intensity={analysis.average * 3} color="#10b981" distance={90} decay={1} />
      <pointLight position={[0, 2, 0]} intensity={analysis.bass * 2.5} color="#8b5cf6" distance={40} decay={2} />
    </>
  )
}
