import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'

/** Anillo de radar que se expande desde el centro de la sala */
function RadarPulse() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = (state.clock.elapsedTime % 4) / 4
    const scale = 1 + t * 24
    ref.current.scale.set(scale, scale, scale)
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = (1 - t) * 0.5
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <ringGeometry args={[0.95, 1, 48]} />
      <meshBasicMaterial color="#38bdf8" transparent toneMapped={false} />
    </mesh>
  )
}

/** Haz de radar que barre la sala como una manecilla */
function RadarSweep() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.z = -state.clock.elapsedTime * 0.7
  })
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.absarc(0, 0, 22, 0, Math.PI / 7, false)
    shape.lineTo(0, 0)
    return new THREE.ShapeGeometry(shape, 24)
  }, [])
  return (
    <mesh ref={ref} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
      <meshBasicMaterial color="#0ea5e9" transparent opacity={0.14} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

/** Puntos de telemetría flotando como datos en el aire */
function Telemetry({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 50
      arr[i * 3 + 1] = 1 + Math.random() * 16
      arr[i * 3 + 2] = (Math.random() - 0.5) * 50
    }
    return arr
  }, [count])
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.015
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#7dd3fc" size={0.09} transparent opacity={0.6} />
    </points>
  )
}

export function ControlAtmosphere({ quality }: ThemeAtmosphereProps) {
  const count = quality === 'high' ? 240 : quality === 'medium' ? 120 : 50
  return (
    <>
      <Telemetry count={count} />
      <RadarPulse />
      {quality !== 'low' && <RadarSweep />}
    </>
  )
}
