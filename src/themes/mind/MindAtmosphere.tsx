import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

function NeuronCloud({ count, quality }: { count: number; quality: string }) {
  const pointsRef = useRef<THREE.Points>(null)
  const linesRef = useRef<THREE.LineSegments>(null)

  const { positions, connections } = useMemo(() => {
    const pos: THREE.Vector3[] = []
    for (let i = 0; i < count; i++) {
      pos.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 70,
          Math.random() * 35,
          (Math.random() - 0.5) * 50
        )
      )
    }

    const conn: number[] = []
    const maxConnections = quality === 'high' ? 3 : quality === 'medium' ? 2 : 1
    const connectionDistance = quality === 'high' ? 7 : 9

    for (let i = 0; i < count; i++) {
      let connectionsCount = 0
      for (let j = i + 1; j < count && connectionsCount < maxConnections; j++) {
        if (pos[i]!.distanceTo(pos[j]!) < connectionDistance) {
          conn.push(pos[i]!.x, pos[i]!.y, pos[i]!.z, pos[j]!.x, pos[j]!.y, pos[j]!.z)
          connectionsCount++
        }
      }
    }

    const flatPositions = new Float32Array(pos.length * 3)
    pos.forEach((p, i) => {
      flatPositions[i * 3] = p.x
      flatPositions[i * 3 + 1] = p.y
      flatPositions[i * 3 + 2] = p.z
    })

    return { positions: flatPositions, connections: new Float32Array(conn) }
  }, [count, quality])

  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.008
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.02
  })

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#c4b5fd" size={0.16} transparent opacity={0.7} sizeAttenuation />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[connections, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#8b5cf6" transparent opacity={0.15} />
      </lineSegments>
    </>
  )
}

function PulseParticles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60
      arr[i * 3 + 1] = Math.random() * 25
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      pos[idx + 1] += Math.sin(time * 2 + pos[idx] * 0.1) * 0.01
    }
    ref.current.geometry.attributes.position.needsUpdate = true
    ref.current.rotation.y = time * 0.015
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#22d3ee" size={0.08} transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

export function MindAtmosphere({ quality }: ThemeAtmosphereProps) {
  const analysis = useAudioStore((state) => state.analysis)
  const neuronCount = quality === 'high' ? 180 : quality === 'medium' ? 100 : 50
  const pulseCount = quality === 'high' ? 400 : quality === 'medium' ? 200 : 80

  return (
    <>
      <NeuronCloud count={neuronCount} quality={quality} />
      <PulseParticles count={pulseCount} />
      <pointLight position={[0, 12, 0]} intensity={analysis.average * 2.5} color="#ec4899" distance={80} decay={1} />
    </>
  )
}
