import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { QualityLevel } from '../../types/presentation'

interface ETLFilterProps {
  position: [number, number, number]
  quality: QualityLevel
}

function FilterParticles({ curve, quality, stage }: { curve: THREE.CatmullRomCurve3; quality: QualityLevel; stage: 'extract' | 'transform' | 'load' }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const count = quality === 'low' ? 16 : quality === 'medium' ? 28 : 44

  const colors = {
    extract: new THREE.Color('#94a3b8'),
    transform: new THREE.Color('#8b5cf6'),
    load: new THREE.Color('#2dd4bf'),
  }

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const progress = (t * 0.06 + i / count) % 1
      const pos = curve.getPointAt(progress)
      dummy.position.copy(pos)
      const scale = 0.08 + Math.sin(t * 3 + i) * 0.025
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color={colors[stage]} emissive={colors[stage]} emissiveIntensity={1.4} toneMapped={false} />
    </instancedMesh>
  )
}

function Sponge({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1, 3)
    const pos = geo.attributes.position
    const vector = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      vector.fromBufferAttribute(pos, i)
      const noise = Math.sin(vector.x * 6) * Math.cos(vector.y * 5) * Math.sin(vector.z * 6) * 0.15
      vector.multiplyScalar(1 + noise)
      pos.setXYZ(i, vector.x, vector.y, vector.z)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.8) * 0.02)
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} scale={1.6} castShadow>
      <meshStandardMaterial color="#f59e0b" roughness={0.95} metalness={0.0} emissive="#f59e0b" emissiveIntensity={0.18} />
    </mesh>
  )
}

function FilteringAnemone({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)
  const tentacles = useMemo(() => Array.from({ length: 16 }, (_, i) => i), [])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      if (i === 0) return
      child.rotation.z = Math.sin(state.clock.elapsedTime * 1.5 + i * 0.5) * 0.2
      child.rotation.x = Math.cos(state.clock.elapsedTime * 1.1 + i * 0.4) * 0.15
    })
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <sphereGeometry args={[0.6, 20, 20]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.8} />
      </mesh>
      {tentacles.map((i) => (
        <mesh key={i} position={[Math.cos(i * 0.39) * 0.35, 0.8, Math.sin(i * 0.39) * 0.35]} rotation={[0, 0, i * 0.39]}>
          <cylinderGeometry args={[0.045, 0.015, 1.8, 6]} />
          <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.45} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  )
}

export function ETLFilter({ position, quality }: ETLFilterProps) {
  const extractCurve = useMemo(() => {
    const start = new THREE.Vector3(position[0] - 6, position[1] + 1, position[2])
    const mid = new THREE.Vector3(position[0] - 3, position[1] + 1.5, position[2])
    const end = new THREE.Vector3(position[0] - 1.2, position[1] + 0.8, position[2])
    return new THREE.CatmullRomCurve3([start, mid, end])
  }, [position])

  const transformCurve = useMemo(() => {
    const start = new THREE.Vector3(position[0] - 0.3, position[1] + 0.8, position[2])
    const mid = new THREE.Vector3(position[0] + 1.2, position[1] + 1.8, position[2])
    const end = new THREE.Vector3(position[0] + 2.8, position[1] + 1.0, position[2])
    return new THREE.CatmullRomCurve3([start, mid, end])
  }, [position])

  const loadCurve = useMemo(() => {
    const start = new THREE.Vector3(position[0] + 3.0, position[1] + 1.0, position[2])
    const mid = new THREE.Vector3(position[0] + 5, position[1] + 1.4, position[2])
    const end = new THREE.Vector3(position[0] + 7, position[1] + 0.6, position[2])
    return new THREE.CatmullRomCurve3([start, mid, end])
  }, [position])

  return (
    <group position={position} scale={0.9}>
      {/* Tubos de corriente */}
      <mesh>
        <tubeGeometry args={[extractCurve, 32, 0.18, 12, false]} />
        <meshStandardMaterial color="#94a3b8" emissive="#94a3b8" emissiveIntensity={0.8} transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <mesh>
        <tubeGeometry args={[transformCurve, 32, 0.18, 12, false]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.8} transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <mesh>
        <tubeGeometry args={[loadCurve, 32, 0.18, 12, false]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" emissiveIntensity={0.8} transparent opacity={0.5} toneMapped={false} />
      </mesh>

      {/* Esponja de extracción */}
      <Sponge position={[-1.4, 0.9, 0]} />
      <pointLight position={[-1.4, 2.0, 0]} color="#f59e0b" intensity={4} distance={10} decay={2} />

      {/* Anémona de transformación */}
      <FilteringAnemone position={[3.0, 1.3, 0]} />
      <pointLight position={[3.0, 2.4, 0]} color="#8b5cf6" intensity={4} distance={10} decay={2} />

      {/* Partículas por etapa */}
      <group position={[-6, 1, 0]}>
        <FilterParticles curve={extractCurve} quality={quality} stage="extract" />
      </group>
      <group position={[-0.3, 0.8, 0]}>
        <FilterParticles curve={transformCurve} quality={quality} stage="transform" />
      </group>
      <group position={[3, 1, 0]}>
        <FilterParticles curve={loadCurve} quality={quality} stage="load" />
      </group>

      {/* Etiquetas E, T, L */}
      {[
        { label: 'E', sub: 'Extracción', pos: [-3.8, 2.6, 0] as const, color: '#94a3b8' },
        { label: 'T', sub: 'Transformación', pos: [1.0, 3.2, 0] as const, color: '#8b5cf6' },
        { label: 'L', sub: 'Carga', pos: [5.2, 2.6, 0] as const, color: '#2dd4bf' },
      ].map((item) => (
        <Billboard key={item.label} position={item.pos}>
          <Text fontSize={0.22} color={item.color} anchorX="center" anchorY="middle" fontWeight={700}>
            {item.label}
          </Text>
          <Text fontSize={0.12} color="#e2e8f0" anchorX="center" anchorY="middle" position={[0, -0.32, 0]}>
            {item.sub}
          </Text>
        </Billboard>
      ))}

      {/* Título general */}
      <Billboard position={[0, 4.2, 0]}>
        <Text fontSize={0.28} color="#f8fafc" anchorX="center" anchorY="middle">
          SISTEMA DE FILTROS ETL
        </Text>
      </Billboard>
    </group>
  )
}
