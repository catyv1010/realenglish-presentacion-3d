import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import type { QualityLevel } from '../../../types/presentation'

interface TransformationTempleProps {
  quality: QualityLevel
}

function CoralArch({ angle, radius, height, color }: { angle: number; radius: number; height: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const curve = useMemo(() => {
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    return new THREE.CatmullRomCurve3([new THREE.Vector3(x, 0, z), new THREE.Vector3(x * 0.6, height * 0.55, z * 0.6), new THREE.Vector3(0, height, 0)])
  }, [angle, radius, height])
  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.02
  })
  return (
    <mesh ref={meshRef}>
      <tubeGeometry args={[curve, 32, 0.1, 10, false]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.7} />
    </mesh>
  )
}

function RotatingRing({ radius, color, speed, y }: { radius: number; color: string; speed: number; y: number }) {
  const ringRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ringRef.current) return
    ringRef.current.rotation.y = state.clock.elapsedTime * speed
    ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
  })
  return (
    <mesh ref={ringRef} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.06, 8, 64]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.8} toneMapped={false} />
    </mesh>
  )
}

function Membrane({ radius, color }: { radius: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!meshRef.current) return
    const s = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.04
    meshRef.current.scale.setScalar(s)
  })
  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.4, radius, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}

function RuneRing({ radius, color }: { radius: number; color: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const runes = useMemo(() => Array.from({ length: 12 }, (_, i) => i), [])
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = -state.clock.elapsedTime * 0.2
  })
  return (
    <group ref={groupRef} position={[0, 0.2, 0]}>
      {runes.map((i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.12, 0.04, 0.04]} />
            <meshBasicMaterial color={color} />
          </mesh>
        )
      })}
    </group>
  )
}

function TransformParticles({ count, fromColor, toColor, radius }: { count: number; fromColor: string; toColor: string; radius: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const fromC = useMemo(() => new THREE.Color(fromColor), [fromColor])
  const toC = useMemo(() => new THREE.Color(toColor), [toColor])
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      angle: Math.random() * Math.PI * 2,
      heightOffset: Math.random() * 4,
      speed: 0.3 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
    }))
  }, [count])
  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    particles.forEach((p, i) => {
      const progress = (t * p.speed + p.phase) % 1
      const currentRadius = radius * (1 - progress * 0.3)
      const x = Math.cos(p.angle + t * 0.2) * currentRadius
      const z = Math.sin(p.angle + t * 0.2) * currentRadius
      const y = progress * 6 - 1 + p.heightOffset * 0.3
      dummy.position.set(x, y, z)
      dummy.scale.setScalar(0.06 + Math.sin(t * 3 + p.phase) * 0.02)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
      meshRef.current!.setColorAt(i, fromC.clone().lerp(toC, progress))
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 5, 5]} />
      <meshStandardMaterial emissiveIntensity={1.5} toneMapped={false} />
    </instancedMesh>
  )
}

export function TransformationTemple({ quality }: TransformationTempleProps) {
  const templeRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const arches = useMemo(() => Array.from({ length: 8 }, (_, i) => i), [])
  const archHeights = useMemo(() => arches.map(() => 6 + Math.random() * 1.5), [arches])
  const particleCount = quality === 'low' ? 80 : quality === 'medium' ? 150 : 220

  useEffect(() => {
    if (!templeRef.current) return
    gsap.from(templeRef.current.scale, { x: 0.01, y: 0.01, z: 0.01, duration: 1.8, ease: 'elastic.out(1, 0.6)' })
  }, [])

  useFrame((state) => {
    if (!coreRef.current) return
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.08
    coreRef.current.scale.setScalar(pulse)
  })

  return (
    <group ref={templeRef} position={[0, 0, 0]} scale={[1, 1, 1]}>
      {arches.map((i) => (
        <CoralArch key={i} angle={(i / 8) * Math.PI * 2} radius={5} height={archHeights[i]} color={i % 2 === 0 ? '#8b5cf6' : '#d946ef'} />
      ))}
      <RotatingRing radius={4.2} color="#10b981" speed={0.3} y={1.5} />
      <RotatingRing radius={3.5} color="#0ea5e9" speed={-0.4} y={3} />
      <RotatingRing radius={2.8} color="#d946ef" speed={0.5} y={4.5} />
      <Membrane radius={4.5} color="#10b981" />
      <Membrane radius={3.2} color="#0ea5e9" />
      <Membrane radius={2} color="#d946ef" />
      <RuneRing radius={5.2} color="#5eead4" />
      <TransformParticles count={particleCount} fromColor="#64748b" toColor="#10b981" radius={4.8} />
      <mesh ref={coreRef} position={[0, 3, 0]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#d946ef" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 3, 0]} color="#d946ef" intensity={10} distance={25} decay={2} />
    </group>
  )
}
