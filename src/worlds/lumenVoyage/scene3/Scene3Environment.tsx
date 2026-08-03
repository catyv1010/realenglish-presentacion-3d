import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'
import { UnderwaterAtmosphere } from '../shared/UnderwaterAtmosphere'
import { MarineParticles } from '../shared/MarineParticles'
import { LightRays } from '../shared/LightRays'
import { CausticFloor } from '../shared/CausticFloor'
import { AbyssalCity } from './AbyssalCity'
import { DataStream } from '../shared/DataStream'
import { FloatingHologram } from '../shared/FloatingHologram'
import { fbm } from '../procedural/math'

interface Scene3EnvironmentProps {
  quality: QualityLevel
}

function abyssFloorHeight(x: number, z: number) {
  let h = fbm(x * 0.02 + 10, z * 0.02 + 10, 4) * 3 - 2
  h += fbm(x * 0.15 + 3, z * 0.15 + 3, 3) * 0.5
  return h
}

function DataRings({ count }: { count: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const rings = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      radius: 6 + i * 1.6,
      speed: 0.1 + i * 0.03,
      y: i * 0.4,
      color: [0xf59e0b, 0x0ea5e9, 0xa855f7, 0x34d399][i % 4],
    }))
  }, [count])
  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      child.rotation.y = state.clock.elapsedTime * rings[i].speed * (i % 2 === 0 ? 1 : -1)
      child.rotation.x = Math.sin(state.clock.elapsedTime * 0.2 + i) * 0.05
    })
  })
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {rings.map((r) => (
        <mesh key={r.id} rotation={[Math.PI / 2, 0, 0]} position={[0, r.y, 0]}>
          <torusGeometry args={[r.radius, 0.04, 6, 64]} />
          <meshBasicMaterial color={r.color} transparent opacity={0.25} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  )
}

export function Scene3Environment({ quality }: Scene3EnvironmentProps) {
  const q = quality
  const particleCount = q === 'low' ? 300 : q === 'medium' ? 700 : 1200
  const ringCount = q === 'low' ? 3 : q === 'medium' ? 5 : 8
  const rayCount = q === 'low' ? 2 : q === 'medium' ? 4 : 6

  return (
    <>
      <UnderwaterAtmosphere
        topColor="#0f172a"
        midColor="#020617"
        bottomColor="#000000"
        fogColor="#020617"
        fogDensity={0.022}
        lightColor="#f59e0b"
        lightIntensity={0.8}
      />
      <ambientLight intensity={0.12} color="#1e3a8a" />
      <hemisphereLight intensity={0.25} color="#1e40af" groundColor="#000000" />
      <pointLight position={[0, 12, 0]} color="#f59e0b" intensity={10} distance={60} decay={1.8} />
      <pointLight position={[-30, 5, -30]} color="#0ea5e9" intensity={5} distance={40} decay={2} />
      <pointLight position={[30, 5, 30]} color="#a855f7" intensity={5} distance={40} decay={2} />
      <pointLight position={[-30, 5, 30]} color="#34d399" intensity={4} distance={40} decay={2} />
      <pointLight position={[30, 5, -30]} color="#f43f5e" intensity={4} distance={40} decay={2} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <planeGeometry args={[200, 200, 1, 1]} />
        <meshStandardMaterial color="#020617" roughness={0.95} metalness={0.1} />
      </mesh>
      <CausticFloor size={160} color="#020617" causticColor="#0ea5e9" causticAmount={0.35} heightFn={abyssFloorHeight} />

      <AbyssalCity quality={q} />
      <DataRings count={ringCount} />

      <DataStream points={[[0, 10, 30], [0, 6, 10], [0, 4, 0]]} color="#64748b" particleColor="#94a3b8" speed={0.08} particleCount={40} />
      <DataStream points={[[-20, 8, 20], [-8, 5, 6], [-2, 3, 0]]} color="#64748b" particleColor="#94a3b8" speed={0.06} particleCount={30} />
      <DataStream points={[[20, 8, -20], [8, 5, -6], [2, 3, 0]]} color="#64748b" particleColor="#94a3b8" speed={0.07} particleCount={30} />
      <DataStream points={[[0, 5, 0], [0, 4, -10], [0, 3, -30]]} color="#f59e0b" particleColor="#fbbf24" speed={0.12} particleCount={60} tubeOpacity={0.6} />

      <MarineParticles count={particleCount} ext={{ x: 60, z: 60, y0: -2, y1: 25 }} size={1.0} color="#f59e0b" opacity={0.35} riseSpeed={0.2} soft />
      <LightRays count={rayCount} color="#f59e0b" bounds={{ x: 40, z: 40, y: 55 }} />

      <FloatingHologram position={[-6, 3, 5]} title="Data Warehouse" description="Los datos transformados se almacenan de forma segura y organizada." color="#f59e0b" />
      <FloatingHologram position={[6, 3, -4]} title="Disponibilidad" description="La información está lista para ser consultada y analizada en cualquier momento." color="#0ea5e9" />
      <FloatingHologram position={[0, 7, 7]} title="Carga" description="El proceso ETL finaliza con los datos integrados en el destino final." color="#a855f7" />
    </>
  )
}
