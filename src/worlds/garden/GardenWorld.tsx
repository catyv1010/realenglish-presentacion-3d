import { useRef, useMemo, useLayoutEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import type { WorldProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

// Flor estilizada
function Flower({ position, color, scale, delay, entranceDuration }: {
  position: [number, number, number]
  color: string
  scale: number
  delay: number
  entranceDuration: number
}) {
  const ref = useRef<THREE.Group>(null)
  const analysis = useAudioStore((state) => state.analysis)

  useLayoutEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: scale, y: scale, z: scale, duration: entranceDuration * 1.2, delay, ease: 'back.out(2)' }
    )
    gsap.fromTo(
      ref.current.position,
      { y: position[1] - 3 },
      { y: position[1], duration: entranceDuration * 1.1, delay, ease: 'power3.out' }
    )
  }, [entranceDuration, delay, position, scale])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.1
    const sway = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05
    ref.current.rotation.z = sway
    const pulse = 1 + analysis.average * 0.1
    ref.current.scale.setScalar(scale * pulse)
  })

  return (
    <group ref={ref} position={position}>
      {/* Tallo */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 1.2, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
      </mesh>
      {/* Pétalos */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.4, 1.3, Math.sin(angle) * 0.4]} rotation={[0.4, angle, 0]}>
            <sphereGeometry args={[0.35, 16, 16]} scale={[1, 0.3, 1]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        )
      })}
      {/* Centro */}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#facc15" roughness={0.4} />
      </mesh>
    </group>
  )
}

// Árbol estilizado tipo jardín
function Tree({ position, scale }: { position: [number, number, number]; scale: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.02
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime + position[0]) * 0.02
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 2, 8]} />
        <meshStandardMaterial color="#92400e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <coneGeometry args={[2, 3.5, 8]} />
        <meshStandardMaterial color="#16a34a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <coneGeometry args={[1.5, 2.5, 8]} />
        <meshStandardMaterial color="#22c55e" roughness={0.8} />
      </mesh>
    </group>
  )
}

// Mariposa que sigue al mouse
function Butterfly({ target }: { target: THREE.Vector3 }) {
  const ref = useRef<THREE.Group>(null)
  const currentPos = useRef(new THREE.Vector3(0, 3, 0))

  useFrame((state, delta) => {
    if (!ref.current) return
    currentPos.current.lerp(new THREE.Vector3(target.x, target.y + 2, target.z + 3), delta * 3)
    ref.current.position.copy(currentPos.current)
    ref.current.lookAt(target)
    ref.current.position.y += Math.sin(state.clock.elapsedTime * 10) * 0.05
  })

  return (
    <group ref={ref} scale={0.3}>
      <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[1, 1.2]} />
        <meshBasicMaterial color="#f472b6" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <planeGeometry args={[1, 1.2]} />
        <meshBasicMaterial color="#f472b6" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
        <meshBasicMaterial color="#1f2937" />
      </mesh>
    </group>
  )
}

// Césped suave
function GardenGround() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(120, 120, 30, 30)
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] = Math.sin(pos[i] * 0.1) * 0.3 + Math.cos(pos[i + 1] * 0.1) * 0.3
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial color="#4ade80" roughness={0.95} />
    </mesh>
  )
}

export function GardenWorld({ scene, entranceDuration }: WorldProps) {
  const config = scene.visualConfig
  const { camera, scene: scene3d, pointer } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))
  const [target, setTarget] = useState(new THREE.Vector3(0, 0, 0))

  scene3d.background = new THREE.Color('#dbeafe')
  scene3d.fog = new THREE.Fog('#dbeafe', 25, 100)

  useFrame(() => {
    raycaster.current.setFromCamera(pointer, camera)
    const intersection = new THREE.Vector3()
    if (raycaster.current.ray.intersectPlane(plane.current, intersection)) {
      intersection.x = Math.max(-35, Math.min(35, intersection.x))
      intersection.z = Math.max(-25, Math.min(25, intersection.z))
      setTarget(intersection)
    }
  })

  const trees = useMemo(() => {
    return Array.from({ length: 12 }).map(() => ({
      position: [(Math.random() - 0.5) * 70, 0, (Math.random() - 0.5) * 50] as [number, number, number],
      scale: 0.8 + Math.random() * 0.7,
    }))
  }, [])

  const palette = ['#f472b6', '#a78bfa', '#fbbf24', '#fb7185', '#34d399', '#60a5fa']

  return (
    <>
      <ambientLight intensity={0.8} color="#fef3c7" />
      <directionalLight position={[15, 25, 10]} intensity={1} color="#fff7ed" castShadow shadow-mapSize={[2048, 2048]} />

      <GardenGround />

      {trees.map((t, i) => (
        <Tree key={i} {...t} />
      ))}

      {config?.buildings?.map((b, i) => (
        <Flower
          key={b.id}
          position={[b.position[0], 0, b.position[2]]}
          color={b.color ?? palette[i % palette.length]}
          scale={1 + (b.size[1] || 2) * 0.15}
          delay={b.entranceDelay ?? 0}
          entranceDuration={entranceDuration}
        />
      ))}

      <Butterfly target={target} />

      <Text
        position={[0, 10, -20]}
        fontSize={2}
        color="#1e40af"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#ffffff"
      >
        {scene.title}
      </Text>

      <Text position={[0, 0.5, 12]} fontSize={0.6} color="#1e3a8a" anchorX="center">
        Mueve el mouse para guiar la mariposa
      </Text>
    </>
  )
}
