import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import type { WorldProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

// Cielo con gradiente de atardecer
function SunsetSky() {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#4c1d95')     // violeta arriba
    gradient.addColorStop(0.35, '#be185d')  // magenta
    gradient.addColorStop(0.6, '#fb923c')   // naranja
    gradient.addColorStop(0.85, '#fde047')  // amarillo
    gradient.addColorStop(1, '#fff7ed')     // blanco cálido abajo
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1024, 512)
    return new THREE.CanvasTexture(canvas)
  }, [])

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[200, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

// Sol gigante
function Sun() {
  return (
    <mesh position={[0, 8, -60]}>
      <circleGeometry args={[18, 64]} />
      <meshBasicMaterial color="#fff7ed" transparent opacity={0.9} />
    </mesh>
  )
}

// Dunas suaves
function Dunes() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(300, 300, 64, 64)
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i]
      const y = pos[i + 1]
      const wave1 = Math.sin(x * 0.05) * 2
      const wave2 = Math.cos(y * 0.03) * 1.5
      const wave3 = Math.sin((x + y) * 0.02) * 3
      pos[i + 2] = wave1 + wave2 + wave3 - 3
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        color="#fbbf24"
        roughness={0.95}
        metalness={0}
        emissive="#f59e0b"
        emissiveIntensity={0.05}
      />
    </mesh>
  )
}

// Monumentos/pilares de piedra
function Monument({ position, color, label, delay, entranceDuration }: {
  position: [number, number, number]
  color: string
  label?: string
  delay: number
  entranceDuration: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const analysis = useAudioStore((state) => state.analysis)

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.position,
      { y: -10 },
      { y: position[1], duration: entranceDuration * 1.3, delay, ease: 'power3.out' }
    )
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: entranceDuration, delay: delay + 0.1, ease: 'back.out(1.2)' }
    )
  }, [entranceDuration, delay, position])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.02
    const pulse = 1 + analysis.bass * 0.08
    groupRef.current.scale.set(pulse, pulse, pulse)
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.8, 1.2, 6, 7]} />
        <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#fff7ed" emissive="#fbbf24" emissiveIntensity={0.3} />
      </mesh>
      {label && (
        <Text position={[0, 5, 0]} fontSize={0.5} color="#fff7ed" anchorX="center">
          {label}
        </Text>
      )}
    </group>
  )
}

// Polvo dorado
function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 80
      arr[i * 3 + 1] = Math.random() * 20
      arr[i * 3 + 2] = (Math.random() - 0.5) * 60
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.005
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3] += Math.sin(state.clock.elapsedTime * 0.2 + i) * 0.005
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#fde047" size={0.15} transparent opacity={0.7} sizeAttenuation />
    </points>
  )
}

export function JourneyWorld({ scene, quality, entranceDuration }: WorldProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)
  const analysis = useAudioStore((state) => state.analysis)

  // Fondo claro: eliminar niegra oscura
  scene3d.background = new THREE.Color('#fff7ed')
  scene3d.fog = new THREE.Fog('#fde68a', 20, 120)

  const dustCount = quality === 'high' ? 800 : quality === 'medium' ? 400 : 150

  return (
    <>
      <ambientLight intensity={0.8} color="#fb923c" />
      <directionalLight
        position={[0, 20, -40]}
        intensity={1.2}
        color="#fff7ed"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[0, 10, 0]} intensity={0.6} color="#fbbf24" distance={80} decay={1.5} />

      <SunsetSky />
      <Sun />
      <Dunes />

      {config?.buildings?.map((b) => (
        <Monument
          key={b.id}
          position={[b.position[0], b.position[1] + 3, b.position[2]]}
          color={b.color ?? '#d97706'}
          label={b.label}
          delay={b.entranceDelay ?? 0}
          entranceDuration={entranceDuration}
        />
      ))}

      <Dust count={dustCount} />

      {/* Título flotante */}
      <Text
        position={[0, 12, -20]}
        fontSize={1.8}
        color="#7c2d12"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.05}
      >
        {scene.title}
      </Text>

      <mesh position={[0, analysis.average * 2, -35]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
    </>
  )
}
