import { useRef, useMemo, useLayoutEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import type { WorldProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

// Avión low poly estilizado
function Plane({ target }: { target: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null)
  const currentPos = useRef(new THREE.Vector3(0, 8, 0))
  const analysis = useAudioStore((state) => state.analysis)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // El avión sigue suavemente al target
    currentPos.current.lerp(target, delta * 2)
    groupRef.current.position.copy(currentPos.current)

    // Inclinación según dirección
    const velocity = new THREE.Vector3().subVectors(target, currentPos.current)
    groupRef.current.rotation.z = -velocity.x * 0.3
    groupRef.current.rotation.x = velocity.z * 0.2

    // Subidita al ritmo
    groupRef.current.position.y += analysis.bass * 0.05
  })

  return (
    <group ref={groupRef} scale={0.8}>
      {/* Cuerpo */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.2, 2.5, 8]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.3} />
      </mesh>
      {/* Cabina */}
      <mesh position={[0, 0.5, -0.3]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.1} metalness={0.3} />
      </mesh>
      {/* Alas */}
      <mesh position={[0, 0, 0.2]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[3.5, 0.15, 0.8]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.3} />
      </mesh>
      {/* Cola */}
      <mesh position={[0, 0.6, 1.2]}>
        <boxGeometry args={[1, 0.8, 0.1]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.3} />
      </mesh>
      {/* Hélice */}
      <mesh position={[0, 0, -1.3]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[1.5, 0.05, 0.1]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
    </group>
  )
}

// Nube esponjosa
function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  const ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.x += Math.sin(state.clock.elapsedTime * 0.2 + position[0]) * 0.002
  })

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0.8, -0.2, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[-0.8, -0.1, 0]}>
        <sphereGeometry args={[0.75, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh position={[0.2, 0.5, 0.3]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    </group>
  )
}

// Terreno con montañas y campos
function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 40, 40)
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      const h = Math.sin(x * 0.05) * 2 + Math.cos(y * 0.04) * 2 + Math.sin((x + y) * 0.02) * 3
      pos[i + 2] = h - 25
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} receiveShadow>
      <meshStandardMaterial color="#86efac" roughness={0.9} />
    </mesh>
  )
}

// Elementos flotantes de la escena (edificios convertidos en islas/nubes especiales)
function FloatingIsland({ position, color, label, delay, entranceDuration }: {
  position: [number, number, number]
  color: string
  label?: string
  delay: number
  entranceDuration: number
}) {
  const ref = useRef<THREE.Group>(null)

  useLayoutEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current.position,
      { y: position[1] - 10 },
      { y: position[1], duration: entranceDuration * 1.2, delay, ease: 'power3.out' }
    )
    gsap.fromTo(
      ref.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: entranceDuration, delay: delay + 0.1, ease: 'back.out(1.5)' }
    )
  }, [entranceDuration, delay, position])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.3
    ref.current.rotation.y = state.clock.elapsedTime * 0.05
  })

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[1.5, 0.8, 1, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      {label && (
        <Text position={[0, 2.2, 0]} fontSize={0.5} color="#1e3a8a" anchorX="center">
          {label}
        </Text>
      )}
    </group>
  )
}

export function PlaneWorld({ scene, entranceDuration }: WorldProps) {
  const config = scene.visualConfig
  const { camera, scene: scene3d, pointer } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -8))
  const [target, setTarget] = useState(new THREE.Vector3(0, 8, 0))

  // Fondo azul cielo
  scene3d.background = new THREE.Color('#38bdf8')
  scene3d.fog = new THREE.Fog('#38bdf8', 30, 120)

  // Click/mouse mueve el avión
  useFrame(() => {
    raycaster.current.setFromCamera(pointer, camera)
    const intersection = new THREE.Vector3()
    if (raycaster.current.ray.intersectPlane(plane.current, intersection)) {
      intersection.x = Math.max(-40, Math.min(40, intersection.x))
      intersection.z = Math.max(-30, Math.min(30, intersection.z))
      setTarget(intersection)
    }
  })

  const clouds = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      position: [(Math.random() - 0.5) * 80, 2 + Math.random() * 15, (Math.random() - 0.5) * 60] as [number, number, number],
      scale: 0.8 + Math.random() * 1.5,
    }))
  }, [])

  return (
    <>
      <ambientLight intensity={0.7} color="#e0f2fe" />
      <directionalLight position={[20, 30, -20]} intensity={1.1} color="#fff7ed" castShadow shadow-mapSize={[2048, 2048]} />

      <Terrain />

      {clouds.map((c, i) => (
        <Cloud key={i} {...c} />
      ))}

      {config?.buildings?.map((b) => (
        <FloatingIsland
          key={b.id}
          position={[b.position[0], 6 + (b.entranceDelay || 0) * 3, b.position[2]]}
          color={b.color ?? '#fbbf24'}
          label={b.label}
          delay={b.entranceDelay ?? 0}
          entranceDuration={entranceDuration}
        />
      ))}

      <Plane target={target} />

      <Text
        position={[0, 16, -20]}
        fontSize={2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#0369a1"
      >
        {scene.title}
      </Text>

      <Text position={[0, -2, 10]} fontSize={0.6} color="#1e3a8a" anchorX="center">
        Mueve el mouse / click para volar
      </Text>
    </>
  )
}
