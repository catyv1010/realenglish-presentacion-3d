import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'
import { StarField } from '../../components/3d/StarField'
import { AmbientParticles } from '../../components/3d/AmbientParticles'
import { useAudioStore } from '../../store/useAudioStore'

function RainLayer({ count, area, speed }: { count: number; area: number; speed: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * area
      arr[i * 3 + 1] = Math.random() * 40
      arr[i * 3 + 2] = (Math.random() - 0.5) * area
    }
    return arr
  }, [count, area])

  useFrame((_, delta) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= speed * delta * (0.8 + Math.random() * 0.4)
      if (pos[i * 3 + 1] < 0) {
        pos[i * 3 + 1] = 40
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#a5b4fc" size={0.04} transparent opacity={0.5} depthWrite={false} />
    </points>
  )
}

function TrafficLines({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const { initial, colors } = useMemo(() => {
    const initialMatrix: THREE.Matrix4[] = []
    const colorArray: THREE.Color[] = []
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 60
      const z = (Math.random() - 0.5) * 60
      const y = 0.3 + Math.random() * 0.5
      const scaleX = 0.5 + Math.random() * 1.5
      dummy.position.set(x, y, z)
      dummy.rotation.set(0, Math.random() * Math.PI, 0)
      dummy.scale.set(scaleX, 0.04, 0.04)
      dummy.updateMatrix()
      initialMatrix.push(dummy.matrix.clone())
      colorArray.push(new THREE.Color(['#06b6d4', '#ec4899', '#facc15'][i % 3]))
    }
    return { initial: initialMatrix, colors: colorArray }
  }, [count, dummy])

  useFrame((state) => {
    if (!ref.current) return
    const time = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const m = initial[i]
      if (!m) continue
      dummy.position.setFromMatrixPosition(m)
      const speed = 2 + (i % 4)
      const axis = Math.round(dummy.rotation.y) % Math.PI === 0 ? 'x' : 'z'
      const offset = Math.sin(time * speed + i) * 20
      if (axis === 'x') {
        dummy.position.x = ((dummy.position.x + offset + 30) % 60) - 30
      } else {
        dummy.position.z = ((dummy.position.z + offset + 30) % 60) - 30
      }
      dummy.scale.setFromMatrixScale(m)
      dummy.rotation.setFromRotationMatrix(m)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
      ref.current.setColorAt(i, colors[i] ?? new THREE.Color('#ffffff'))
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

export function CyberpunkAtmosphere({ scene, quality }: ThemeAtmosphereProps) {
  const config = scene.visualConfig
  const analysis = useAudioStore((state) => state.analysis)

  const rainCount = quality === 'high' ? 6000 : quality === 'medium' ? 3000 : 0
  const trafficCount = quality === 'high' ? 40 : quality === 'medium' ? 20 : 0

  return (
    <>
      {config?.showStars !== false && <StarField />}
      {config?.showAmbientParticles !== false && (
        <AmbientParticles count={quality === 'high' ? 200 : quality === 'medium' ? 120 : 60} />
      )}
      {config?.rain && rainCount > 0 && <RainLayer count={rainCount} area={80} speed={18} />}
      {config?.traffic && trafficCount > 0 && <TrafficLines count={trafficCount} />}
      {analysis.average > 0.6 && (
        <pointLight position={[0, 20, 0]} intensity={analysis.average * 2} color="#ffffff" distance={60} decay={2} />
      )}
    </>
  )
}
