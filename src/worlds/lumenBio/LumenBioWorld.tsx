import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Scene } from '../../types/presentation'
import type { WorldProps } from '../types'
import { usePresentationStore } from '../../store/usePresentationStore'

const BG = '#e0f7fa'
const FOG_DENSITY = 0.012

interface BioCameraProps {
  scene: Scene
}

function BioCamera({ scene }: BioCameraProps) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera)
  const navigationMode = usePresentationStore((state) => state.navigationMode)
  const targetPosition = useMemo(() => new THREE.Vector3(...scene.cameraPosition), [scene.cameraPosition])
  const targetLookAt = useMemo(() => new THREE.Vector3(...scene.cameraTarget), [scene.cameraTarget])
  const speed = useRef(0.035)

  useFrame((state) => {
    if (navigationMode === 'free') return
    const controls = state.controls as unknown as { target: THREE.Vector3; update: () => void } | null
    camera.position.lerp(targetPosition, speed.current)
    if (controls) {
      controls.target.lerp(targetLookAt, speed.current)
      controls.update()
    } else {
      camera.lookAt(targetLookAt)
    }
  })

  return null
}

function Nucleus({ position, quality }: { position: [number, number, number]; quality: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const detail = quality === 'low' ? 32 : quality === 'medium' ? 64 : 96

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) {
      const s = 1 + Math.sin(t * 1.2) * 0.04
      meshRef.current.scale.set(s, s, s)
    }
    if (lightRef.current) {
      lightRef.current.intensity = 3 + Math.sin(t * 2) * 0.8
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[2.2, detail, detail]} />
        <meshPhysicalMaterial
          color="#0ea5e9"
          emissive="#06b6d4"
          emissiveIntensity={0.8}
          roughness={0.4}
          metalness={0.1}
          transmission={0.35}
          thickness={2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.35, detail, detail]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} wireframe />
      </mesh>
      <pointLight ref={lightRef} color="#22d3ee" intensity={3.5} distance={30} decay={1.8} />
      <Billboard position={[0, 3.2, 0]}>
        <Text fontSize={0.35} color="#f0f9ff" anchorX="center" anchorY="middle">
          DATA WAREHOUSE
        </Text>
      </Billboard>
    </group>
  )
}

function ProteinRings() {
  const groupRef = useRef<THREE.Group>(null)
  const dims = useMemo(
    () => [
      { label: 'Tiempo', color: '#f472b6', radius: 3.2 },
      { label: 'Paciente', color: '#60a5fa', radius: 3.9 },
      { label: 'Profesional', color: '#a78bfa', radius: 4.6 },
      { label: 'Especialidad', color: '#34d399', radius: 5.3 },
      { label: 'Sede', color: '#fbbf24', radius: 6.0 },
      { label: 'Estado', color: '#f87171', radius: 6.7 },
    ],
    []
  )

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        child.rotation.x += 0.001 * (i % 2 === 0 ? 1 : -1)
        child.rotation.y += 0.0015 * (i % 3 === 0 ? 1 : -1)
      })
    }
  })

  return (
    <group ref={groupRef}>
      {dims.map((dim) => (
        <group key={dim.label} rotation={[Math.random() * 1.5, Math.random() * 1.5, 0]}>
          <mesh>
            <torusGeometry args={[dim.radius, 0.07, 8, 120]} />
            <meshStandardMaterial color={dim.color} emissive={dim.color} emissiveIntensity={1.1} toneMapped={false} />
          </mesh>
          <Billboard position={[dim.radius + 0.5, 0, 0]}>
            <Text fontSize={0.18} color={dim.color} anchorX="center" anchorY="middle">
              {dim.label}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}

function Axon({ from, to, color = '#f59e0b', quality }: { from: [number, number, number]; to: [number, number, number]; color?: string; quality: string }) {
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from)
    const end = new THREE.Vector3(...to)
    const mid1 = new THREE.Vector3().lerpVectors(start, end, 0.35)
    const mid2 = new THREE.Vector3().lerpVectors(start, end, 0.65)
    mid1.x += (Math.random() - 0.5) * 4
    mid1.y += Math.max(2, start.distanceTo(end) * 0.25)
    mid2.x += (Math.random() - 0.5) * 4
    mid2.y += Math.max(2, start.distanceTo(end) * 0.2)
    return new THREE.CatmullRomCurve3([start, mid1, mid2, end])
  }, [from, to])

  const particleCount = quality === 'low' ? 10 : quality === 'medium' ? 20 : 34
  const particlesRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useRef(new THREE.Object3D())

  useFrame((state) => {
    if (!particlesRef.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < particleCount; i++) {
      const progress = (t * 0.06 + i / particleCount) % 1
      const pos = curve.getPointAt(progress)
      dummy.current.position.copy(pos)
      const scale = 0.14 + Math.sin(t * 4 + i) * 0.04
      dummy.current.scale.set(scale, scale, scale)
      dummy.current.updateMatrix()
      particlesRef.current.setMatrixAt(i, dummy.current.matrix)
    }
    particlesRef.current.instanceMatrix.needsUpdate = true
  })

  const tubularSegments = quality === 'low' ? 24 : 48
  const radialSegments = quality === 'low' ? 6 : 10

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, tubularSegments, 0.16, radialSegments, false]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} transparent opacity={0.55} />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, tubularSegments, 0.05, radialSegments, false]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>
      <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#fff7ed" emissive={color} emissiveIntensity={2} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

function CellSource({ label, position, color, quality }: { label: string; position: [number, number, number]; color: string; quality: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const detail = quality === 'low' ? 16 : 32

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.12
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.08
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[1.1, detail, detail]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.35}
          metalness={0.1}
          transmission={0.25}
          thickness={1}
          transparent
          opacity={0.85}
        />
      </mesh>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[Math.cos(i) * 1.4, Math.sin(i) * 0.5, Math.sin(i) * 1.4]}>
          <sphereGeometry args={[0.35, 12, 12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
      ))}
      <pointLight color={color} intensity={2.5} distance={12} decay={2} />
      <Billboard position={[0, 2, 0]}>
        <Text fontSize={0.26} color="#f8fafc" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </Billboard>
      <Billboard position={[0, 1.6, 0]}>
        <Text fontSize={0.13} color={color} anchorX="center" anchorY="middle">
          Fuente interna
        </Text>
      </Billboard>
    </group>
  )
}

function ExternalOrganism({ label, position, color }: { label: string; position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.12
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.6 + position[0]) * 0.15
    }
  })

  return (
    <group ref={ref} position={position}>
      <mesh>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} metalness={0.2} transparent opacity={0.85} />
      </mesh>
      {[...Array(6)].map((_, i) => (
        <mesh key={i} position={[Math.cos(i) * 1.3, 0, Math.sin(i) * 1.3]}>
          <sphereGeometry args={[0.18, 10, 10]} />
          <meshStandardMaterial color="#ffffff" emissive={color} emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      ))}
      <pointLight color={color} intensity={2} distance={10} decay={2} />
      <Billboard position={[0, 1.8, 0]}>
        <Text fontSize={0.22} color="#f8fafc" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </Billboard>
    </group>
  )
}

function KPIOculus({ position, quality }: { position: [number, number, number]; quality: string }) {
  const ref = useRef<THREE.Group>(null)
  const kpis = [
    { label: 'Absentismo', value: '12%', color: '#f87171' },
    { label: 'Satisfacción', value: '4.6', color: '#34d399' },
    { label: 'Ocupación', value: '82%', color: '#60a5fa' },
    { label: 'Metas', value: '91%', color: '#fbbf24' },
  ]
  const detail = quality === 'low' ? 16 : 32

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <group ref={ref} position={position}>
      <mesh>
        <torusGeometry args={[2.2, 0.25, detail, 64]} />
        <meshPhysicalMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.2, detail, detail]} />
        <meshStandardMaterial color="#064e3b" emissive="#34d399" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      {kpis.map((kpi, i) => {
        const angle = (i / kpis.length) * Math.PI * 2
        return (
          <group key={kpi.label} position={[Math.cos(angle) * 2.8, 0, Math.sin(angle) * 2.8]}>
            <Billboard>
              <Text fontSize={0.2} color="#f8fafc" anchorX="center" anchorY="middle" position={[0, 0.15, 0]}>
                {kpi.value}
              </Text>
            </Billboard>
            <Billboard>
              <Text fontSize={0.12} color={kpi.color} anchorX="center" anchorY="middle" position={[0, -0.15, 0]}>
                {kpi.label}
              </Text>
            </Billboard>
          </group>
        )
      })}
      <pointLight color="#10b981" intensity={3} distance={18} decay={1.8} />
      <Billboard position={[0, 3.2, 0]}>
        <Text fontSize={0.28} color="#f8fafc" anchorX="center" anchorY="middle">
          OBSERVATORIO KPI
        </Text>
      </Billboard>
    </group>
  )
}

function BioParticles({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useRef(new THREE.Object3D())
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: new THREE.Vector3((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60),
      speed: 0.003 + Math.random() * 0.01,
      offset: Math.random() * Math.PI * 2,
      scale: 0.05 + Math.random() * 0.1,
    }))
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    particles.forEach((p, i) => {
      dummy.current.position.set(
        p.position.x,
        p.position.y + Math.sin(t * p.speed + p.offset) * 0.6,
        p.position.z
      )
      const s = p.scale * (1 + Math.sin(t * 2 + p.offset) * 0.3)
      dummy.current.scale.set(s, s, s)
      dummy.current.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.current.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#a5f3fc" transparent opacity={0.5} />
    </instancedMesh>
  )
}

function TitleLabel() {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 5.5 + Math.sin(state.clock.elapsedTime * 0.6) * 0.1
    }
  })
  return (
    <Billboard ref={ref} position={[0, 5.5, 0]}>
      <Text fontSize={0.55} color="#f0f9ff" anchorX="center" anchorY="middle" letterSpacing={0.06}>
        LUMEN HEALTH
      </Text>
      <Text fontSize={0.22} color="#22d3ee" anchorX="center" anchorY="middle" position={[0, -0.55, 0]} letterSpacing={0.04}>
        MICROCOSMOS DE DATOS
      </Text>
    </Billboard>
  )
}

export function LumenBioWorld({ scene, quality }: WorldProps) {
  const config = scene.visualConfig
  const { scene: scene3d } = useThree()

  const particleCount = useMemo(() => {
    switch (quality) {
      case 'low':
        return 60
      case 'medium':
        return 120
      default:
        return 200
    }
  }, [quality])

  useEffect(() => {
    scene3d.background = new THREE.Color(config?.backgroundColor ?? BG)
    scene3d.fog = new THREE.FogExp2(config?.backgroundColor ?? BG, config?.fogDensity ?? FOG_DENSITY)
    return () => {
      scene3d.background = new THREE.Color(BG)
      scene3d.fog = null
    }
  }, [scene3d, config?.backgroundColor, config?.fogDensity])

  return (
    <>
      <BioCamera scene={scene} />

      <ambientLight intensity={0.9} color="#ffffff" />
      <hemisphereLight intensity={0.6} color="#e0f2fe" groundColor="#94a3b8" />
      <directionalLight position={[15, 30, 15]} intensity={1.4} color="#fff7ed" castShadow shadow-mapSize={[2048, 2048]} />
      <spotLight position={[0, 20, -10]} angle={0.7} penumbra={0.6} intensity={0.5} color="#0ea5e9" distance={60} decay={2} />

      <TitleLabel />

      <group position={[0, 0, 0]}>
        <Nucleus position={[0, 2, 4]} quality={quality} />
        <ProteinRings />
      </group>

      <CellSource label="Citas" position={[-8, 1, -4]} color="#22d3ee" quality={quality} />
      <CellSource label="Profesionales" position={[-3, 0, -10]} color="#818cf8" quality={quality} />
      <CellSource label="Productos" position={[4, 0, -10]} color="#c084fc" quality={quality} />
      <CellSource label="Contable" position={[9, 1, -4]} color="#f472b6" quality={quality} />

      <ExternalOrganism label="OMS" position={[-12, 2, 6]} color="#10b981" />
      <ExternalOrganism label="Ministerio" position={[-8, 3, 12]} color="#10b981" />
      <ExternalOrganism label="INEC" position={[-3, 2, 15]} color="#10b981" />

      <Axon from={[-8, 1.5, -4]} to={[0, 2.5, 4]} color="#f59e0b" quality={quality} />
      <Axon from={[-3, 1, -10]} to={[0, 2.5, 4]} color="#f59e0b" quality={quality} />
      <Axon from={[-8, 2, 12]} to={[0, 2.5, 4]} color="#f59e0b" quality={quality} />

      <KPIOculus position={[11, 4, 4]} quality={quality} />

      <BioParticles count={particleCount} />
    </>
  )
}
