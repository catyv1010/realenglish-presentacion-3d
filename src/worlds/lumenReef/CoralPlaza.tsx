import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'

function ProceduralCoralRock({ position, scale = 1, color = '#0f4c5c' }: { position: [number, number, number]; scale?: number; color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 2)
    const pos = geo.attributes.position
    const vector = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      vector.fromBufferAttribute(pos, i)
      const noise = Math.sin(vector.x * 3 + vector.y * 4) * Math.cos(vector.z * 3) * 0.25
      const scaleNoise = 1 + noise * 0.5
      vector.multiplyScalar(scaleNoise)
      pos.setXYZ(i, vector.x, vector.y, vector.z)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15 + position[0]) * 0.03
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} scale={[scale, scale * 0.85, scale]} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.95} metalness={0.05} emissive={color} emissiveIntensity={0.16} />
    </mesh>
  )
}

function BrainCoral({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.scale.setScalar(scale + Math.sin(state.clock.elapsedTime * 0.8) * 0.015)
  })

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial
        color="#7c3aed"
        roughness={0.85}
        metalness={0.05}
        emissive="#7c3aed"
        emissiveIntensity={0.28}
      />
    </mesh>
  )
}

function GlowingAnemone({ position, color = '#22d3ee' }: { position: [number, number, number]; color?: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const tentacles = useMemo(() => Array.from({ length: 12 }, (_, i) => i), [])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(state.clock.elapsedTime * 1.2 + i * 0.6) * 0.15
      child.rotation.x = Math.cos(state.clock.elapsedTime * 0.9 + i * 0.4) * 0.1
    })
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      {tentacles.map((i) => (
        <mesh key={i} position={[Math.cos(i * 0.52) * 0.2, 0.5, Math.sin(i * 0.52) * 0.2]} rotation={[0, 0, i * 0.52]}>
          <cylinderGeometry args={[0.03, 0.01, 1.2, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  )
}

export function CoralPlaza() {
  const platformRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!platformRef.current) return
    platformRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.03
  })

  return (
    <group>
      {/* Plataforma principal de coral */}
      <mesh ref={platformRef} position={[0, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[10, 11, 0.6, 96]} />
        <meshStandardMaterial color="#143049" roughness={0.9} metalness={0.05} emissive="#143049" emissiveIntensity={0.06} />
      </mesh>

      {/* Borde irregular de coral */}
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2
        const radius = 10.2 + Math.random() * 0.8
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const s = 0.4 + Math.random() * 0.5
        return <ProceduralCoralRock key={i} position={[x, 0.3, z]} scale={s} color={i % 2 === 0 ? '#1e4d5c' : '#2d4a5e'} />
      })}

      {/* Formaciones de coral en la plaza */}
      <ProceduralCoralRock position={[-6, 1.2, -5]} scale={1.6} color="#155e75" />
      <ProceduralCoralRock position={[6, 0.9, -5]} scale={1.5} color="#164e63" />
      <ProceduralCoralRock position={[-4, 0.7, 6]} scale={1.2} color="#1e3a8a" />
      <ProceduralCoralRock position={[5, 1.0, 5.5]} scale={1.3} color="#312e81" />
      <ProceduralCoralRock position={[-8, 0.5, 0]} scale={1.1} color="#0f4c5c" />
      <ProceduralCoralRock position={[8, 0.6, 1]} scale={1.2} color="#1d4ed8" />
      <ProceduralCoralRock position={[0, 0.8, -8]} scale={1.3} color="#0e7490" />

      <BrainCoral position={[-6.5, 0.7, 2]} scale={0.7} />
      <BrainCoral position={[6, 0.6, -1.5]} scale={0.6} />

      <GlowingAnemone position={[-2.5, 0.4, 2]} color="#22d3ee" />
      <GlowingAnemone position={[2.8, 0.4, -2]} color="#f472b6" />
      <GlowingAnemone position={[0, 0.4, 4]} color="#a78bfa" />
      <GlowingAnemone position={[-4.5, 0.3, -1]} color="#2dd4bf" />
      <GlowingAnemone position={[4.5, 0.3, 1.5]} color="#c084fc" />

      {/* Podium central con perla pequeña */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.6, 1.8, 0.8, 48]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.35} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          roughness={0.1}
          metalness={0.1}
          transmission={0.3}
          thickness={0.8}
          emissive="#fbbf24"
          emissiveIntensity={0.45}
        />
      </mesh>
      <pointLight position={[0, 1.8, 0]} color="#fbbf24" intensity={5} distance={16} decay={2} />

      {/* Título flotante */}
      <Billboard position={[0, 4.2, 0]}>
        <Text fontSize={0.6} color="#f8fafc" anchorX="center" anchorY="middle" letterSpacing={0.06}>
          LUMEN HEALTH
        </Text>
        <Text fontSize={0.22} color="#22d3ee" anchorX="center" anchorY="middle" position={[0, -0.65, 0]} letterSpacing={0.04}>
          EL ARRECIFE DE LA MEMORIA
        </Text>
      </Billboard>
    </group>
  )
}
