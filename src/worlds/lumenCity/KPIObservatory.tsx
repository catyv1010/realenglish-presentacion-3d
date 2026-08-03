import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { QualityLevel } from '../../types/presentation'

interface KPIObservatoryProps {
  position: [number, number, number]
  quality: QualityLevel
}

const KPIS = [
  { label: 'Absentismo', value: '12%', color: '#f87171' },
  { label: 'Satisfacción', value: '4.6', color: '#34d399' },
  { label: 'Ocupación', value: '82%', color: '#60a5fa' },
  { label: 'Metas', value: '91%', color: '#fbbf24' },
]

function KPIDisplay({ label, value, color, index }: { label: string; value: string; color: string; index: number }) {
  return (
    <group position={[Math.cos(index) * 2.2, 1.8 + index * 0.9, Math.sin(index) * 2.2]}>
      <mesh>
        <planeGeometry args={[1.6, 1]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <Billboard position={[0, 0.18, 0.03]}>
        <Text fontSize={0.22} color="#f8fafc" anchorX="center" anchorY="middle">
          {value}
        </Text>
      </Billboard>
      <Billboard position={[0, -0.2, 0.03]}>
        <Text fontSize={0.12} color={color} anchorX="center" anchorY="middle">
          {label}
        </Text>
      </Billboard>
    </group>
  )
}

export function KPIObservatory({ position, quality }: KPIObservatoryProps) {
  const ringRef = useRef<THREE.Mesh>(null)
  const towerHeight = 14
  const detail = quality === 'low' ? 6 : quality === 'medium' ? 8 : 12

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.y = state.clock.elapsedTime * 0.04
    }
  })

  return (
    <group position={position}>
      {/* Columna */}
      <mesh position={[0, towerHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.7, 1.2, towerHeight, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.25} metalness={0.8} />
      </mesh>

      {/* Plataforma de observación */}
      <mesh position={[0, towerHeight, 0]}>
        <cylinderGeometry args={[3.2, 3.2, 0.3, detail * 2]} />
        <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Anillo rotatorio */}
      <mesh ref={ringRef} position={[0, towerHeight + 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.1, 8, 64]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>

      {/* Cúpula del observatorio */}
      <mesh position={[0, towerHeight + 1.2, 0]}>
        <sphereGeometry args={[1.3, detail * 2, detail * 2, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#10b981"
          metalness={0.1}
          roughness={0.05}
          transmission={0.5}
          thickness={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Haz de escaneo */}
      <mesh position={[0, towerHeight + 4, 0]}>
        <cylinderGeometry args={[0.04, 1.2, 6, 16]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* Pantallas KPI */}
      {KPIS.map((kpi, i) => (
        <KPIDisplay key={kpi.label} label={kpi.label} value={kpi.value} color={kpi.color} index={i} />
      ))}

      <pointLight position={[0, towerHeight + 1.5, 0]} color="#10b981" intensity={4} distance={18} decay={2} />

      <Billboard position={[0, towerHeight + 3.2, 0]}>
        <Text fontSize={0.28} color="#f8fafc" anchorX="center" anchorY="middle">
          OBSERVATORIO KPI
        </Text>
      </Billboard>
    </group>
  )
}
