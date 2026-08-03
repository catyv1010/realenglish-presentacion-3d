import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Text, Billboard } from '@react-three/drei'
import type { ThemeEnvironmentProps } from '../types'

const NIVELES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const NIVEL_COLORS = ['#22c55e', '#84cc16', '#f59e0b', '#FF7700', '#f26b65', '#525fe1']

export function AcademiaEnvironment({ scene, quality }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)
  const cloudsRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.0045
    scene3d.background = new THREE.Color('#dbe4ff')
    scene3d.fog = new THREE.FogExp2('#dbe4ff', fogDensity)
  }, [config?.fogDensity, scene3d])

  const cloudCount = quality === 'high' ? 10 : quality === 'medium' ? 7 : 4

  const clouds = useMemo(() => {
    const data: { pos: [number, number, number]; s: number; speed: number }[] = []
    for (let i = 0; i < cloudCount; i++) {
      data.push({
        pos: [((i * 19) % 90) - 45, 18 + ((i * 7) % 10), -20 - ((i * 13) % 40)],
        s: 1.4 + ((i * 5) % 10) / 6,
        speed: 0.3 + ((i * 3) % 10) / 25,
      })
    }
    return data
  }, [cloudCount])

  const cloudMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, metalness: 0, emissive: '#ffffff', emissiveIntensity: 0.05 }),
    []
  )
  const cloudGeo = useMemo(() => new THREE.SphereGeometry(1, 14, 14), [])

  const hills = useMemo(() => {
    const data: { pos: [number, number, number]; s: [number, number, number]; c: string }[] = []
    const greens = ['#9fd08f', '#8cc07c', '#b2dda3', '#7db56d']
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      const r = 58 + ((i * 11) % 20)
      data.push({
        pos: [Math.cos(a) * r, -2, Math.sin(a) * r],
        s: [14 + ((i * 7) % 12), 6 + ((i * 5) % 6), 14 + ((i * 9) % 10)],
        c: greens[i % greens.length],
      })
    }
    return data
  }, [])

  useFrame((_state, delta) => {
    if (!cloudsRef.current) return
    cloudsRef.current.children.forEach((c, i) => {
      c.position.x += delta * clouds[i % clouds.length].speed
      if (c.position.x > 55) c.position.x = -55
    })
  })

  return (
    <>
      {/* Día soleado en el campus */}
      <hemisphereLight args={['#ffffff', '#c9d4ff', 0.75]} />
      <ambientLight intensity={0.35} color="#fff6e0" />
      <directionalLight position={[35, 42, 20]} intensity={1.15} color="#fff2cf" castShadow shadow-mapSize={[2048, 2048]} />

      {/* Sol */}
      <mesh position={[42, 46, -70]}>
        <sphereGeometry args={[5, 24, 24]} />
        <meshBasicMaterial color="#ffe9a3" />
      </mesh>
      <mesh position={[42, 46, -70]}>
        <sphereGeometry args={[7.5, 24, 24]} />
        <meshBasicMaterial color="#fff3c4" transparent opacity={0.16} depthWrite={false} />
      </mesh>

      {/* Plaza del campus (lavanda del sitio) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <circleGeometry args={[95, 56]} />
        <meshStandardMaterial color="#dfe3fa" roughness={0.95} metalness={0} />
      </mesh>
      {/* Caminito circular */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[10.5, 12.5, 56]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <ringGeometry args={[11.4, 11.6, 56]} />
        <meshBasicMaterial color="#525fe1" transparent opacity={0.55} />
      </mesh>

      {/* Colinas verdes al horizonte */}
      {hills.map((h, i) => (
        <mesh key={`hill-${i}`} position={h.pos} scale={h.s}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={h.c} roughness={1} metalness={0} />
        </mesh>
      ))}

      {/* Portales del camino MCER: de A1 a C2 */}
      {NIVELES.map((nivel, i) => {
        const a = Math.PI * (0.15 + (i / (NIVELES.length - 1)) * 0.7)
        const r = 26
        const x = Math.cos(a) * r
        const z = -Math.sin(a) * r
        return (
          <group key={nivel} position={[x, 0, z]} rotation={[0, a + Math.PI / 2, 0]}>
            <mesh position={[-2.2, 1.6, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 3.2, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.7} />
            </mesh>
            <mesh position={[2.2, 1.6, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 3.2, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.7} />
            </mesh>
            <mesh position={[0, 3.4, 0]} castShadow>
              <boxGeometry args={[5.2, 0.7, 0.5]} />
              <meshStandardMaterial color={NIVEL_COLORS[i]} roughness={0.5} emissive={NIVEL_COLORS[i]} emissiveIntensity={0.15} />
            </mesh>
            <Text position={[0, 3.42, 0.3]} fontSize={0.42} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
              {nivel}
            </Text>
          </group>
        )
      })}

      {/* Libro abierto gigante: el monumento del campus */}
      <group position={[0, 0, -30]} rotation={[0, 0, 0]}>
        <mesh position={[-3.1, 2.1, 0]} rotation={[0.25, 0, 0.28]} castShadow>
          <boxGeometry args={[6.4, 0.5, 4.6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
        <mesh position={[3.1, 2.1, 0]} rotation={[0.25, 0, -0.28]} castShadow>
          <boxGeometry args={[6.4, 0.5, 4.6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[2.2, 2.4, 4.8]} />
          <meshStandardMaterial color="#525fe1" roughness={0.5} />
        </mesh>
        <Billboard position={[0, 6.2, 0]}>
          <mesh>
            <planeGeometry args={[8.6, 1.5]} />
            <meshStandardMaterial color="#1a2d62" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[8.8, 1.7]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
          <Text position={[-1.35, 0, 0.02]} fontSize={0.72} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
            REAL ENGLISH
          </Text>
          <Text position={[3.05, 0, 0.02]} fontSize={0.72} color="#f26b65" anchorX="center" anchorY="middle" fontWeight="bold">
            CR
          </Text>
        </Billboard>
      </group>

      {/* Nubes que pasean */}
      <group ref={cloudsRef}>
        {clouds.map((c, i) => (
          <group key={`cloud-${i}`} position={c.pos} scale={c.s}>
            <mesh geometry={cloudGeo} material={cloudMat} scale={[2.4, 1, 1.4]} />
            <mesh geometry={cloudGeo} material={cloudMat} position={[1.6, 0.35, 0.2]} scale={[1.5, 0.8, 1]} />
            <mesh geometry={cloudGeo} material={cloudMat} position={[-1.5, 0.3, -0.2]} scale={[1.3, 0.7, 0.9]} />
          </group>
        ))}
      </group>
    </>
  )
}
