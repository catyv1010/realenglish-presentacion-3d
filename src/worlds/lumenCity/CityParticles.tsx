import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CityParticlesProps {
  count?: number
}

export function CityParticles({ count = 100 }: CityParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useRef(new THREE.Object3D())

  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 60,
        1 + Math.random() * 20,
        (Math.random() - 0.5) * 50
      ),
      speed: 0.005 + Math.random() * 0.015,
      offset: Math.random() * Math.PI * 2,
    }))
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    particles.forEach((p, i) => {
      dummy.current.position.set(
        p.position.x,
        p.position.y + Math.sin(t * p.speed + p.offset) * 0.5,
        p.position.z
      )
      const scale = 0.08 + Math.sin(t * 2 + p.offset) * 0.03
      dummy.current.scale.set(scale, scale, scale)
      dummy.current.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.current.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#bae6fd" transparent opacity={0.6} />
    </instancedMesh>
  )
}
