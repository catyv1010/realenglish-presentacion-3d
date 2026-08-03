import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../types/presentation'

interface ETLBridgeProps {
  from: [number, number, number]
  to: [number, number, number]
  color?: string
  quality: QualityLevel
}

export function ETLBridge({ from, to, color = '#f59e0b', quality }: ETLBridgeProps) {
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from)
    const end = new THREE.Vector3(...to)
    const mid = new THREE.Vector3().lerpVectors(start, end, 0.5)
    mid.y += Math.max(2, start.distanceTo(end) * 0.25)
    return new THREE.CatmullRomCurve3([start, mid, end])
  }, [from, to])

  const particleCount = quality === 'low' ? 8 : quality === 'medium' ? 16 : 28
  const particlesRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useRef<THREE.Object3D>(new THREE.Object3D())

  useFrame((state) => {
    if (!particlesRef.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < particleCount; i++) {
      const progress = (t * 0.08 + i / particleCount) % 1
      const pos = curve.getPointAt(progress)
      dummy.current.position.copy(pos)
      const scale = 0.12 + Math.sin(t * 4 + i) * 0.04
      dummy.current.scale.set(scale, scale, scale)
      dummy.current.updateMatrix()
      particlesRef.current.setMatrixAt(i, dummy.current.matrix)
    }
    particlesRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      {/* Tubo de energía */}
      <mesh>
        <tubeGeometry args={[curve, quality === 'low' ? 32 : 64, 0.12, quality === 'low' ? 6 : 10, false]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          toneMapped={false}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Núcleo más brillante del tubo */}
      <mesh>
        <tubeGeometry args={[curve, quality === 'low' ? 32 : 64, 0.04, quality === 'low' ? 6 : 10, false]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Partículas de datos */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={2} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
