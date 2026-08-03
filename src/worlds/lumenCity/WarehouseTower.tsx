import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { QualityLevel } from '../../types/presentation'

interface WarehouseTowerProps {
  position: [number, number, number]
  quality: QualityLevel
}

const DIMENSIONS = [
  { label: 'Tiempo', color: '#f472b6' },
  { label: 'Paciente', color: '#60a5fa' },
  { label: 'Profesional', color: '#a78bfa' },
  { label: 'Especialidad', color: '#34d399' },
  { label: 'Sede', color: '#fbbf24' },
  { label: 'Estado', color: '#f87171' },
]

function FactCore() {
  const coreRef = useRef<THREE.Mesh>(null)
  const pulseRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (coreRef.current) {
      const scale = 1 + Math.sin(t * 1.5) * 0.06
      coreRef.current.scale.set(scale, scale, scale)
    }
    if (pulseRef.current) {
      pulseRef.current.intensity = 4 + Math.sin(t * 2) * 1.5
    }
  })

  return (
    <group>
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={2}
          toneMapped={false}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
      <pointLight ref={pulseRef} color="#fbbf24" intensity={5} distance={24} decay={1.5} />
    </group>
  )
}

function DimensionRings() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.rotation.x += 0.002 * (i % 2 === 0 ? 1 : -1)
        child.rotation.y += 0.003 * (i % 3 === 0 ? 1 : -1)
      })
    }
  })

  return (
    <group ref={groupRef}>
      {DIMENSIONS.map((dim, i) => {
        const radius = 2.4 + i * 0.7
        return (
          <group key={dim.label} rotation={[Math.random() * 0.5, Math.random() * 0.5, 0]}>
            <mesh>
              <torusGeometry args={[radius, 0.06, 10, 100]} />
              <meshStandardMaterial color={dim.color} emissive={dim.color} emissiveIntensity={1.1} toneMapped={false} transparent opacity={0.85} />
            </mesh>
            <Text
              fontSize={0.22}
              color={dim.color}
              anchorX="center"
              anchorY="middle"
              position={[radius + 0.5, 0, 0]}
            >
              {dim.label}
            </Text>
          </group>
        )
      })}
    </group>
  )
}

export function WarehouseTower({ position, quality }: WarehouseTowerProps) {
  const height = 22
  const ringCount = quality === 'low' ? 4 : quality === 'medium' ? 6 : 8

  const rings = useMemo(() => {
    return Array.from({ length: ringCount }).map((_, i) => ({
      y: 2 + i * ((height - 4) / ringCount),
      radius: 1.6 + (i % 3) * 0.25,
    }))
  }, [ringCount, height])

  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <cylinderGeometry args={[3.6, 4, 0.5, 64]} />
        <meshStandardMaterial color="#1e293b" roughness={0.25} metalness={0.75} />
      </mesh>

      {/* Anillos estructurales */}
      {rings.map((ring, i) => (
        <mesh key={i} position={[0, ring.y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[ring.radius, 0.08, 8, 96]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}

      {/* Manto de cristal */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[2.2, 3, height, 8, 1, true]} />
        <meshPhysicalMaterial
          color="#a855f7"
          metalness={0.05}
          roughness={0.04}
          transmission={0.55}
          thickness={2}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Columna central */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.9, 1.2, height, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.9} emissive="#6b21a8" emissiveIntensity={0.25} />
      </mesh>

      {/* Núcleo de hechos y anillos dimensionales */}
      <group position={[0, height * 0.6, 0]}>
        <FactCore />
        <DimensionRings />
      </group>

      {/* Luz general de la torre */}
      <pointLight position={[0, height * 0.6, 0]} color="#a855f7" intensity={5} distance={30} decay={1.5} />

      {/* Etiqueta */}
      <Billboard position={[0, height + 1.2, 0]}>
        <Text fontSize={0.32} color="#f8fafc" anchorX="center" anchorY="middle">
          DATA WAREHOUSE
        </Text>
      </Billboard>
      <Billboard position={[0, height + 0.75, 0]}>
        <Text fontSize={0.16} color="#a855f7" anchorX="center" anchorY="middle">
          Tabla de hechos + 6 dimensiones
        </Text>
      </Billboard>
    </group>
  )
}
