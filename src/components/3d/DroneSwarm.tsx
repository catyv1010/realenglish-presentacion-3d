import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import type { DroneConfig } from '../../types/presentation'

interface DroneSwarmProps {
  config: DroneConfig
}

export function DroneSwarm({ config }: DroneSwarmProps) {
  const droneRef = useRef<THREE.Mesh>(null)
  const color = config.color ?? '#facc15'
  const speed = config.speed ?? 0.5
  const size = config.size ?? 0.15

  const curve = useMemo(() => {
    const points = config.path.map((p) => new THREE.Vector3(...p))
    return new THREE.CatmullRomCurve3(points, true)
  }, [config.path])

  useFrame((state) => {
    if (!droneRef.current) return
    const t = (state.clock.elapsedTime * speed * 0.1) % 1
    const point = curve.getPoint(t)
    const tangent = curve.getTangent(t)
    droneRef.current.position.copy(point)
    droneRef.current.lookAt(point.clone().add(tangent))
  })

  return (
    <Trail
      width={0.3}
      length={8}
      color={color}
      attenuation={(width) => width}
    >
      <mesh ref={droneRef}>
        <coneGeometry args={[size, size * 3, 4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Trail>
  )
}
