import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'
import { UnderwaterAtmosphere } from '../shared/UnderwaterAtmosphere'
import { MarineParticles } from '../shared/MarineParticles'
import { CausticFloor } from '../shared/CausticFloor'
import { BioluminescentForest } from './BioluminescentForest'
import { TransformationTemple } from './TransformationTemple'
import { ForestFloor } from './ForestFloor'
import { Jellyfish } from '../shared/Jellyfish'
import { DataStream } from '../shared/DataStream'
import { FloatingHologram } from '../shared/FloatingHologram'
import { fbm } from '../procedural/math'

interface Scene2EnvironmentProps {
  quality: QualityLevel
}

function forestFloorHeight(x: number, z: number) {
  let h = fbm(x * 0.025 + 20, z * 0.025 + 20, 4) * 2.5 - 1.4
  h += fbm(x * 0.18 + 5, z * 0.18 + 5, 3) * 0.3
  return h
}

function EnergySparks({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18
      pos[i * 3 + 1] = Math.random() * 10
      pos[i * 3 + 2] = (Math.random() - 0.5) * 18
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({ color: 0x5eead4, size: 0.08, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })
    return { geometry: geo, material: mat }
  }, [count])
  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05
  })
  return <points ref={pointsRef} geometry={geometry} material={material} />
}

function GodRay() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.04
    ref.current.scale.set(s, 1, s)
    ref.current.rotation.y = state.clock.elapsedTime * 0.03
  })
  return (
    <mesh ref={ref} position={[0, 6, 0]} rotation={[0, 0, 0]}>
      <coneGeometry args={[3.5, 18, 32, 1, true]} />
      <meshBasicMaterial color="#d946ef" transparent opacity={0.055} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}

function AccentLights() {
  return (
    <>
      <pointLight position={[-6, 1.2, -5]} color="#10b981" intensity={3} distance={12} decay={2} />
      <pointLight position={[7, 1.0, 4]} color="#0ea5e9" intensity={2.5} distance={12} decay={2} />
      <pointLight position={[0, 0.8, -8]} color="#d946ef" intensity={2.5} distance={12} decay={2} />
      <pointLight position={[-4, 0.9, 7]} color="#8b5cf6" intensity={2} distance={10} decay={2} />
    </>
  )
}

export function Scene2Environment({ quality }: Scene2EnvironmentProps) {
  const q = quality
  const particleCount = q === 'low' ? 500 : q === 'medium' ? 1000 : 1700
  const sparkCount = q === 'low' ? 60 : q === 'medium' ? 110 : 180
  return (
    <>
      <UnderwaterAtmosphere
        topColor="#2e1065"
        midColor="#1e1b4b"
        bottomColor="#0f0a1e"
        fogColor="#0f0a1e"
        fogDensity={0.018}
        lightColor="#c084fc"
        lightIntensity={1.2}
      />
      <ambientLight intensity={0.08} color="#4c1d95" />
      <hemisphereLight intensity={0.2} color="#8b5cf6" groundColor="#0f0a1e" />
      <pointLight position={[0, 6, 0]} color="#d946ef" intensity={7} distance={28} decay={2} />
      <pointLight position={[-8, 4, -8]} color="#10b981" intensity={3.5} distance={20} decay={2} />
      <pointLight position={[8, 4, 8]} color="#0ea5e9" intensity={3.5} distance={20} decay={2} />
      <AccentLights />

      <ForestFloor quality={q} />
      <CausticFloor size={120} color="#1a1033" causticColor="#34d399" causticAmount={0.55} heightFn={forestFloorHeight} />
      <BioluminescentForest quality={q} />
      <TransformationTemple quality={q} />
      <GodRay />

      <DataStream points={[[-12, 8, -12], [-6, 5, -5], [-2, 3, -1]]} color="#64748b" particleColor="#94a3b8" speed={0.06} particleCount={30} />
      <DataStream points={[[12, 8, -12], [6, 5, -5], [2, 3, -1]]} color="#64748b" particleColor="#94a3b8" speed={0.05} particleCount={30} />
      <DataStream points={[[0, 8, 14], [0, 5, 5], [0, 3, 2]]} color="#64748b" particleColor="#94a3b8" speed={0.07} particleCount={30} />
      <DataStream points={[[0, 6, 0], [0, 2, 8], [0, -2, 22]]} color="#10b981" particleColor="#34d399" speed={0.1} particleCount={50} tubeOpacity={0.5} />

      <Jellyfish position={[-6, 7, -4]} scale={1.2} color="#8b5cf6" pulseSpeed={1} driftSpeed={0.4} />
      <Jellyfish position={[7, 5, 3]} scale={0.9} color="#d946ef" pulseSpeed={1.3} driftSpeed={0.6} />
      <Jellyfish position={[-3, 9, 6]} scale={1.1} color="#0ea5e9" pulseSpeed={0.9} driftSpeed={0.5} />
      <Jellyfish position={[5, 8, -7]} scale={0.7} color="#10b981" pulseSpeed={1.1} driftSpeed={0.45} />
      <Jellyfish position={[-8, 4, 5]} scale={0.8} color="#a855f7" pulseSpeed={0.8} driftSpeed={0.55} />
      <Jellyfish position={[4, 3, -9]} scale={0.6} color="#5eead4" pulseSpeed={1.2} driftSpeed={0.5} />

      <EnergySparks count={sparkCount} />
      <MarineParticles count={particleCount} ext={{ x: 50, z: 50, y0: -2, y1: 24 }} size={1.2} color="#c084fc" opacity={0.4} riseSpeed={0.25} soft />

      <FloatingHologram position={[-5.2, 3.2, 3]} title="Limpieza de datos" description="Los datos se validan, se eliminan duplicados y se corrigen errores antes de continuar." color="#10b981" />
      <FloatingHologram position={[6.5, 3, 2.5]} title="Normalización" description="Los formatos se unifican para que todas las fuentes hablen el mismo idioma." color="#0ea5e9" />
      <FloatingHologram position={[0, 7, 4.5]} title="Transformación" description="Los datos brutos se convierten en información estructurada lista para el análisis." color="#d946ef" />
    </>
  )
}
