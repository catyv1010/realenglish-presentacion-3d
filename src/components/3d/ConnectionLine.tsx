import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import type { ConnectionConfig } from '../../types/presentation'

interface ConnectionLineProps {
  config: ConnectionConfig
  entranceDuration?: number
}

export function ConnectionLine({ config, entranceDuration = 1 }: ConnectionLineProps) {
  const groupRef = useRef<THREE.Group>(null)
  const particleRef = useRef<THREE.Mesh>(null)
  const delay = config.entranceDelay ?? 0

  const curve = useMemo(() => {
    const [x1, y1, z1] = config.from
    const [x2, y2, z2] = config.to

    if (config.curved) {
      const midPoint = new THREE.Vector3(
        (x1 + x2) / 2,
        Math.max(y1, y2) + 3,
        (z1 + z2) / 2
      )
      return new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(x1, y1, z1),
        midPoint,
        new THREE.Vector3(x2, y2, z2)
      )
    }

    return new THREE.LineCurve3(
      new THREE.Vector3(x1, y1, z1),
      new THREE.Vector3(x2, y2, z2)
    )
  }, [config])

  const tubeGeometry = useMemo(
    () => new THREE.TubeGeometry(curve, 32, 0.04, 8, false),
    [curve]
  )

  useLayoutEffect(() => {
    if (!groupRef.current) return

    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: entranceDuration * 0.8,
        delay,
        ease: 'elastic.out(1, 0.5)',
      }
    )
  }, [entranceDuration, delay])

  useFrame((state) => {
    if (particleRef.current && config.animated) {
      const t = (state.clock.elapsedTime * 0.3) % 1
      const point = curve.getPoint(t)
      particleRef.current.position.copy(point)
    }
  })

  const color = config.color ?? '#22d3ee'

  return (
    <group ref={groupRef} scale={[0, 0, 0]}>
      <mesh geometry={tubeGeometry}>
        <meshBasicMaterial color={color} transparent opacity={0.7} />
      </mesh>
      {config.animated && (
        <mesh ref={particleRef}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>
      )}
    </group>
  )
}
