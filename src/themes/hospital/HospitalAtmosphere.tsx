import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'

/** Luz de ambulancia que patrulla el perímetro alternando rojo y azul */
function AmbulanceLight() {
  const ref = useRef<THREE.PointLight>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * 0.35
    ref.current.position.set(Math.cos(t) * 18, 1.2, Math.sin(t) * 18)
    ref.current.color.set(Math.floor(state.clock.elapsedTime * 4) % 2 === 0 ? '#ef4444' : '#3b82f6')
  })
  return <pointLight ref={ref} intensity={2.2} distance={16} decay={2} />
}

/** Polvo suave flotando en el aire nocturno */
function CityDust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60
      arr[i * 3 + 1] = Math.random() * 22
      arr[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.008
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#bae6fd" size={0.08} transparent opacity={0.5} />
    </points>
  )
}

export function HospitalAtmosphere({ quality }: ThemeAtmosphereProps) {
  const count = quality === 'high' ? 260 : quality === 'medium' ? 130 : 50
  return (
    <>
      <CityDust count={count} />
      <AmbulanceLight />
    </>
  )
}
