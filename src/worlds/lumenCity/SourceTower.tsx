import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { QualityLevel } from '../../types/presentation'

interface SourceTowerProps {
  label: string
  position: [number, number, number]
  color: string
  accent: string
  height?: number
  quality: QualityLevel
}

export function SourceTower({ label, position, color, accent, height = 8, quality }: SourceTowerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const windowsCount = quality === 'low' ? 24 : quality === 'medium' ? 48 : 80

  const windowInstances = useMemo(() => {
    const instances: { position: THREE.Vector3; scale: THREE.Vector3 }[] = []
    const rows = Math.floor(windowsCount / 4)
    for (let i = 0; i < rows; i++) {
      for (let side = 0; side < 4; side++) {
        const y = 1.2 + i * ((height - 2) / rows)
        const angle = (side * Math.PI) / 2
        const radius = 1.05
        instances.push({
          position: new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius),
          scale: new THREE.Vector3(0.12, 0.25, 0.05),
        })
      }
    }
    return instances
  }, [windowsCount, height])

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.03
    }
  })

  const dummy = useRef<THREE.Object3D>(new THREE.Object3D())
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    if (!instancedMeshRef.current) return
    windowInstances.forEach((data, i) => {
      dummy.current.position.copy(data.position)
      dummy.current.scale.copy(data.scale)
      dummy.current.rotation.set(0, (i % 4) * (Math.PI / 2), 0)
      dummy.current.updateMatrix()
      instancedMeshRef.current!.setMatrixAt(i, dummy.current.matrix)
    })
    instancedMeshRef.current.instanceMatrix.needsUpdate = true
  }, [windowInstances])

  return (
    <group ref={groupRef} position={position}>
      {/* Base */}
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <boxGeometry args={[2.6, 0.4, 2.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Cuerpo de cristal */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[1.8, height, 1.8]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.1}
          roughness={0.05}
          transmission={0.45}
          thickness={1.2}
          transparent
          opacity={0.7}
          emissive={accent}
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Núcleo energético interno */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.35, 0.35, height * 0.9, 16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>

      {/* Ventanas instanciadas */}
      <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, windowInstances.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f8fafc" emissive={color} emissiveIntensity={0.8} toneMapped={false} />
      </instancedMesh>

      {/* Antena superior */}
      <mesh position={[0, height + 0.6, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, height + 1.3, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, height + 1.3, 0]} color={color} intensity={3} distance={10} decay={2} />

      {/* Etiqueta flotante */}
      <Billboard position={[0, height + 2, 0]}>
        <Text fontSize={0.28} color="#f1f5f9" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </Billboard>
      <Billboard position={[0, height + 1.7, 0]}>
        <Text fontSize={0.16} color={color} anchorX="center" anchorY="middle">
          Fuente interna
        </Text>
      </Billboard>
    </group>
  )
}
