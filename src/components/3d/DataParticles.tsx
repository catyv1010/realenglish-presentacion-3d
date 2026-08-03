import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ParticlePathConfig } from '../../types/presentation'

interface DataParticlesProps {
  config: ParticlePathConfig
}

export function DataParticles({ config }: DataParticlesProps) {
  const groupRef = useRef<THREE.Group>(null)
  const count = config.count ?? 15
  const color = config.color ?? '#22d3ee'

  const curve = useMemo(() => {
    const points = config.points.map((p) => new THREE.Vector3(...p))
    return new THREE.CatmullRomCurve3(points)
  }, [config.points])

  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, index) => ({
      offset: index / count,
      speed: 0.15 + Math.random() * 0.1,
    }))
  }, [count])

  useFrame((state) => {
    if (!groupRef.current) return

    groupRef.current.children.forEach((child, index) => {
      const particle = particles[index]
      if (!particle) return
      const t = (state.clock.elapsedTime * particle.speed + particle.offset) % 1
      const point = curve.getPoint(t)
      child.position.copy(point)
    })
  })

  return (
    <group ref={groupRef}>
      {particles.map((_, index) => (
        <mesh key={index}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  )
}
