import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'

/** Rayos láser de seguridad que barren la bóveda */
function SecurityLasers() {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.25
  })
  return (
    <group ref={ref}>
      {Array.from({ length: 4 }).map((_, i) => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 14, 5, Math.sin(a) * 14]}
            rotation={[0, -a, Math.PI / 2.6]}
          >
            <cylinderGeometry args={[0.015, 0.015, 22, 6]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.55} toneMapped={false} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Chispas doradas suspendidas en la bóveda */
function GoldDust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 45
      arr[i * 3 + 1] = Math.random() * 18
      arr[i * 3 + 2] = (Math.random() - 0.5) * 45
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = -state.clock.elapsedTime * 0.012
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#fbbf24" size={0.09} transparent opacity={0.65} />
    </points>
  )
}

export function VaultAtmosphere({ quality }: ThemeAtmosphereProps) {
  const count = quality === 'high' ? 240 : quality === 'medium' ? 120 : 45
  return (
    <>
      <GoldDust count={count} />
      {quality !== 'low' && <SecurityLasers />}
    </>
  )
}
