import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface KelpForestProps {
  count: number
  radius: number
  innerRadius?: number
}

const KELP_COLOR = '#14532d'
const KELP_EMISSIVE = '#22c55e'

export function KelpForest({ count, radius, innerRadius = 0 }: KelpForestProps) {
  const instancedRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const kelpData = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.8
      const r = innerRadius + Math.random() * (radius - innerRadius)
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        height: 4 + Math.random() * 5,
        thickness: 0.12 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
        swaySpeed: 0.5 + Math.random() * 0.5,
      }
    })
  }, [count, radius, innerRadius])

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.08, 0.18, 1, 8, 16, true)
    geo.translate(0, 0.5, 0)
    return geo
  }, [])

  useFrame((state) => {
    if (!instancedRef.current) return
    const t = state.clock.elapsedTime
    kelpData.forEach((k, i) => {
      const sway = Math.sin(t * k.swaySpeed + k.phase) * 0.15
      dummy.position.set(k.x, 0, k.z)
      dummy.rotation.set(0, k.phase + sway * 2, sway)
      dummy.scale.set(k.thickness, k.height, k.thickness)
      dummy.updateMatrix()
      instancedRef.current!.setMatrixAt(i, dummy.matrix)
    })
    instancedRef.current.instanceMatrix.needsUpdate = true
  })

  useEffect(() => {
    if (instancedRef.current) {
      instancedRef.current.instanceMatrix.needsUpdate = true
    }
  }, [kelpData])

  return (
    <instancedMesh ref={instancedRef} args={[geometry, undefined, count]} castShadow receiveShadow>
      <meshStandardMaterial
        color={KELP_COLOR}
        emissive={KELP_EMISSIVE}
        emissiveIntensity={0.25}
        roughness={0.8}
        side={THREE.DoubleSide}
        transparent
        opacity={0.95}
      />
    </instancedMesh>
  )
}
