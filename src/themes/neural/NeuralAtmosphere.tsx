import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

function SynapseParticles({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 50
      arr[i * 3 + 1] = (Math.random() - 0.5) * 30
      arr[i * 3 + 2] = (Math.random() - 0.5) * 50
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.02
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#a855f7" size={0.12} transparent opacity={0.8} />
    </points>
  )
}

export function NeuralAtmosphere({ quality }: ThemeAtmosphereProps) {
  const analysis = useAudioStore((state) => state.analysis)
  const count = quality === 'high' ? 300 : quality === 'medium' ? 150 : 60

  return (
    <>
      <SynapseParticles count={count} />
      <pointLight position={[0, 0, 0]} intensity={analysis.average * 1.5} color="#a855f7" distance={80} decay={1} />
    </>
  )
}
