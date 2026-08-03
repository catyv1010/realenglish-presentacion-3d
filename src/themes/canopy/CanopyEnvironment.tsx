import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { ThemeEnvironmentProps } from '../types'

interface CeibaData {
  x: number
  z: number
  height: number
  trunkR: number
  crownS: number
  rot: number
  hue: number
}

export function CanopyEnvironment({ scene, quality }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)
  const mistRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.02
    scene3d.background = new THREE.Color('#04121a')
    scene3d.fog = new THREE.FogExp2('#0a1f26', fogDensity)
  }, [config?.fogDensity, scene3d])

  const treeCount = quality === 'high' ? 24 : quality === 'medium' ? 16 : 10
  const mistCount = quality === 'high' ? 12 : quality === 'medium' ? 8 : 5

  // Ceibas gigantes alrededor del claro central
  const ceibas = useMemo<CeibaData[]>(() => {
    const data: CeibaData[] = []
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + Math.sin(i * 7.3) * 0.25
      const radius = 20 + ((i * 13) % 24) + (i % 3) * 4
      data.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        height: 16 + ((i * 5.7) % 12),
        trunkR: 0.7 + ((i * 3.1) % 10) / 12,
        crownS: 3.5 + ((i * 7.7) % 10) / 3,
        rot: (i * 2.39996) % (Math.PI * 2),
        hue: (i % 5) / 5,
      })
    }
    return data
  }, [treeCount])

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.55, 1.15, 1, 8), [])
  const crownGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), [])
  const trunkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2e2118',
        emissive: '#0f2e22',
        emissiveIntensity: 0.12,
        roughness: 0.95,
        metalness: 0,
      }),
    []
  )
  const crownMats = useMemo(() => {
    const base = ['#0c3b2a', '#0e4632', '#0a3325', '#11503a', '#0d3d2c']
    return base.map(
      (c) =>
        new THREE.MeshStandardMaterial({
          color: c,
          emissive: '#12463a',
          emissiveIntensity: 0.18,
          roughness: 0.85,
          metalness: 0,
        })
    )
  }, [])

  // Cables de tirolesa entre copas lejanas
  const ziplines = useMemo(() => {
    const cables: THREE.TubeGeometry[] = []
    const n = quality === 'low' ? 4 : 7
    for (let i = 0; i < n; i++) {
      const a = ceibas[(i * 3) % ceibas.length]
      const b = ceibas[(i * 3 + Math.floor(ceibas.length / 2)) % ceibas.length]
      if (!a || !b) continue
      const start = new THREE.Vector3(a.x, a.height + 1.5, a.z)
      const end = new THREE.Vector3(b.x, b.height + 1.5, b.z)
      const mid = start.clone().lerp(end, 0.5)
      mid.y = Math.min(start.y, end.y) - 3.5
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
      cables.push(new THREE.TubeGeometry(curve, 24, 0.025, 5, false))
    }
    return cables
  }, [ceibas, quality])

  const cableMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#7dd3fc',
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  )

  // Capas de neblina que cruzan el bosque
  const mists = useMemo(() => {
    const layers: { pos: [number, number, number]; scale: number; speed: number; opacity: number }[] = []
    for (let i = 0; i < mistCount; i++) {
      layers.push({
        pos: [((i * 17) % 60) - 30, 2.5 + ((i * 11) % 9), ((i * 23) % 56) - 28],
        scale: 0.7 + ((i * 7) % 10) / 8,
        speed: 0.25 + ((i * 3) % 10) / 22,
        opacity: 0.05 + ((i * 5) % 10) / 160,
      })
    }
    return layers
  }, [mistCount])

  useFrame((_state, delta) => {
    if (!mistRef.current) return
    mistRef.current.children.forEach((m, i) => {
      m.position.x += delta * mists[i % mists.length].speed
      if (m.position.x > 40) m.position.x = -40
    })
  })

  return (
    <>
      {/* Luz de luna sobre el bosque nuboso */}
      <ambientLight intensity={0.16} color="#1e4d5c" />
      <directionalLight position={[24, 38, -18]} intensity={0.7} color="#bfe8ff" castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 12, 0]} intensity={1.1} color="#34d399" distance={70} decay={2} />
      <pointLight position={[-18, 6, 14]} intensity={0.6} color="#2dd4bf" distance={45} decay={2} />
      <pointLight position={[18, 6, -14]} intensity={0.55} color="#c084fc" distance={45} decay={2} />

      {/* Luna llena */}
      <mesh position={[34, 40, -60]}>
        <sphereGeometry args={[5, 24, 24]} />
        <meshBasicMaterial color="#e8f6ff" />
      </mesh>
      <mesh position={[34, 40, -60]}>
        <sphereGeometry args={[6.5, 24, 24]} />
        <meshBasicMaterial color="#bfe8ff" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Suelo del bosque */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[90, 48]} />
        <meshStandardMaterial color="#07241c" roughness={1} metalness={0} />
      </mesh>
      {/* Musgo que brilla bajo la luna */}
      {[...Array(14)].map((_, i) => (
        <mesh
          key={`moss-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[Math.cos(i * 2.4) * (6 + (i % 5) * 6), 0.01, Math.sin(i * 2.4) * (6 + (i % 5) * 6)]}
        >
          <circleGeometry args={[1.2 + (i % 3) * 0.8, 20]} />
          <meshBasicMaterial color="#14532d" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Ceibas gigantes */}
      {ceibas.map((t, i) => (
        <group key={`ceiba-${i}`} position={[t.x, 0, t.z]} rotation={[0, t.rot, 0]}>
          <mesh geometry={trunkGeo} material={trunkMat} scale={[t.trunkR, t.height, t.trunkR]} position={[0, t.height / 2, 0]} castShadow />
          <mesh geometry={crownGeo} material={crownMats[i % crownMats.length]} scale={[t.crownS, t.crownS * 0.5, t.crownS]} position={[0, t.height + t.crownS * 0.25, 0]} castShadow />
          <mesh geometry={crownGeo} material={crownMats[(i + 2) % crownMats.length]} scale={[t.crownS * 0.7, t.crownS * 0.38, t.crownS * 0.7]} position={[t.crownS * 0.55, t.height - 0.6, t.crownS * 0.2]} />
          <mesh geometry={crownGeo} material={crownMats[(i + 3) % crownMats.length]} scale={[t.crownS * 0.6, t.crownS * 0.33, t.crownS * 0.6]} position={[-t.crownS * 0.5, t.height - 1, -t.crownS * 0.25]} />
        </group>
      ))}

      {/* Cables de tirolesa */}
      {ziplines.map((geo, i) => (
        <mesh key={`zip-${i}`} geometry={geo} material={cableMat} />
      ))}

      {/* Neblina del bosque nuboso */}
      <group ref={mistRef}>
        {mists.map((m, i) => (
          <mesh key={`mist-${i}`} position={m.pos} rotation={[0, (i * 0.9) % Math.PI, 0]} scale={m.scale}>
            <planeGeometry args={[34, 7]} />
            <meshBasicMaterial color="#9fc7d4" transparent opacity={m.opacity} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </>
  )
}
