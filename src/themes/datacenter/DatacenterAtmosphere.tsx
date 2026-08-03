import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'

/** Flujo de datos que sube hacia la "nube": columnas de partículas ascendentes */
function BackupStream({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = Math.random() * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      speeds[i] = 1 + Math.random() * 2.5
    }
    return { positions, speeds }
  }, [count])

  useFrame((_, delta) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += data.speeds[i] * delta
      if (pos[i * 3 + 1] > 20) pos[i * 3 + 1] = 0
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#34d399" size={0.1} transparent opacity={0.75} />
    </points>
  )
}

/** "Nube" de respaldo flotando sobre el centro de datos */
function BackupCloud() {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = 17 + Math.sin(state.clock.elapsedTime * 0.6) * 0.5
    ref.current.rotation.y = state.clock.elapsedTime * 0.1
  })
  return (
    <group ref={ref} position={[0, 17, 0]}>
      {[[-1.6, 0, 0, 1.3], [0, 0.5, 0, 1.7], [1.7, -0.1, 0, 1.2], [0.4, -0.4, 1, 1.1]].map(
        ([cx, cy, cz, r], i) => (
          <mesh key={i} position={[cx, cy, cz]}>
            <sphereGeometry args={[r, 16, 16]} />
            <meshStandardMaterial
              color="#0d9488"
              emissive="#14b8a6"
              emissiveIntensity={0.35}
              transparent
              opacity={0.55}
              roughness={0.3}
            />
          </mesh>
        )
      )}
    </group>
  )
}

export function DatacenterAtmosphere({ quality }: ThemeAtmosphereProps) {
  const count = quality === 'high' ? 320 : quality === 'medium' ? 160 : 60
  return (
    <>
      <BackupStream count={count} />
      {quality !== 'low' && <BackupCloud />}
    </>
  )
}
