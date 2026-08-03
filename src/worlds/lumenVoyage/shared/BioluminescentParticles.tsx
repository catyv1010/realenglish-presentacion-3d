import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'

interface BioluminescentParticlesProps {
  count: number
  area: [number, number, number]
  colors: string[]
  quality: QualityLevel
}

export function BioluminescentParticles({ count, area, colors, quality }: BioluminescentParticlesProps) {
  const instancedRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorPalette = useMemo(() => colors.map((c) => new THREE.Color(c)), [colors])

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * area[0],
      y: (Math.random() - 0.5) * area[1],
      z: (Math.random() - 0.5) * area[2],
      phase: Math.random() * Math.PI * 2,
      speed: 0.1 + Math.random() * 0.3,
      radius: 0.03 + Math.random() * 0.05,
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
    }))
  }, [count, area, colorPalette])

  useFrame((state) => {
    if (!instancedRef.current) return
    const t = state.clock.elapsedTime
    particles.forEach((p) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.phase) * 0.3,
        p.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.2,
        p.z + Math.sin(t * p.speed * 0.5 + p.phase) * 0.3
      )
      const scale = p.radius * (0.7 + Math.sin(t * 2 + p.phase) * 0.3)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      instancedRef.current!.setMatrixAt(p.id, dummy.matrix)
      instancedRef.current!.setColorAt(p.id, p.color)
    })
    instancedRef.current.instanceMatrix.needsUpdate = true
    if (instancedRef.current.instanceColor) {
      instancedRef.current.instanceColor.needsUpdate = true
    }
  })

  const segments = quality === 'low' ? 4 : 6

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, segments, segments]} />
      <meshBasicMaterial transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
    </instancedMesh>
  )
}
