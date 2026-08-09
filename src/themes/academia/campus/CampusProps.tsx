import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'
import { RADIO_CAMINO } from './layout'

const GEO = {
  tabla: new THREE.BoxGeometry(1.6, 0.07, 0.42),
  respaldo: new THREE.BoxGeometry(1.6, 0.36, 0.07),
  pataBanca: new THREE.BoxGeometry(0.09, 0.42, 0.4),
  posteFarol: new THREE.CylinderGeometry(0.06, 0.09, 3.2, 8),
  farol: new THREE.SphereGeometry(0.24, 12, 10),
  base: new THREE.CylinderGeometry(0.22, 0.28, 0.16, 10),
  aroFuente: new THREE.TorusGeometry(1.5, 0.18, 8, 24),
  aguaFuente: new THREE.CylinderGeometry(1.45, 1.45, 0.1, 24),
  chorro: new THREE.CylinderGeometry(0.07, 0.14, 1.5, 8),
}

const MAT = {
  madera: new THREE.MeshStandardMaterial({ color: '#a4703f', roughness: 0.9 }),
  hierro: new THREE.MeshStandardMaterial({ color: '#2b3550', roughness: 0.55, metalness: 0.25 }),
  vidrio: new THREE.MeshStandardMaterial({ color: '#fff4cf', emissive: '#ffe9a3', emissiveIntensity: 0.7, roughness: 0.3 }),
  piedra: new THREE.MeshStandardMaterial({ color: '#dfe3fa', roughness: 0.9 }),
  agua: new THREE.MeshStandardMaterial({
    color: '#7fb4ff',
    roughness: 0.12,
    metalness: 0.3,
    transparent: true,
    opacity: 0.82,
  }),
}

function Banca({ position, giro }: { position: [number, number, number]; giro: number }) {
  return (
    <group position={position} rotation={[0, giro, 0]}>
      <mesh geometry={GEO.pataBanca} material={MAT.hierro} position={[-0.66, 0.21, 0]} castShadow />
      <mesh geometry={GEO.pataBanca} material={MAT.hierro} position={[0.66, 0.21, 0]} castShadow />
      <mesh geometry={GEO.tabla} material={MAT.madera} position={[0, 0.44, 0]} castShadow receiveShadow />
      <mesh geometry={GEO.respaldo} material={MAT.madera} position={[0, 0.66, -0.19]} rotation={[0.18, 0, 0]} castShadow />
    </group>
  )
}

function Farol({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh geometry={GEO.base} material={MAT.hierro} position={[0, 0.08, 0]} />
      <mesh geometry={GEO.posteFarol} material={MAT.hierro} position={[0, 1.7, 0]} castShadow />
      <mesh geometry={GEO.farol} material={MAT.vidrio} position={[0, 3.4, 0]} />
    </group>
  )
}

/** Fuente con el chorro girando: da un punto de brillo vivo en la plaza. */
function Fuente({ position }: { position: [number, number, number] }) {
  const chorro = useRef<THREE.Mesh>(null)
  const gotas = useRef<THREE.Points>(null)

  const geoGotas = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const n = 90
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const r = 0.2 + (i % 7) * 0.18
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 0.4 + (i % 11) * 0.16
      pos[i * 3 + 2] = Math.sin(a) * r
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])

  const matGotas = useMemo(
    () => new THREE.PointsMaterial({ color: '#cfe6ff', size: 0.11, transparent: true, opacity: 0.9, depthWrite: false }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (chorro.current) chorro.current.scale.y = 1 + Math.sin(t * 2.4) * 0.12
    if (gotas.current) {
      gotas.current.rotation.y = t * 0.8
      const pos = gotas.current.geometry.attributes.position as THREE.BufferAttribute
      const arr = pos.array as Float32Array
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] -= 0.024
        if (arr[i * 3 + 1] < 0.15) arr[i * 3 + 1] = 2.1
      }
      pos.needsUpdate = true
    }
  })

  return (
    <group position={position}>
      <mesh geometry={GEO.aroFuente} material={MAT.piedra} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.28, 0]} castShadow />
      <mesh geometry={GEO.aguaFuente} material={MAT.agua} position={[0, 0.26, 0]} />
      <mesh ref={chorro} geometry={GEO.chorro} material={MAT.agua} position={[0, 1.05, 0]} />
      <points ref={gotas} geometry={geoGotas} material={matGotas} />
    </group>
  )
}

interface CampusPropsProps {
  quality: QualityLevel
}

/** Mobiliario del campus: bancas y faroles en el sendero, y una fuente. */
export function CampusProps({ quality }: CampusPropsProps) {
  const nBancas = quality === 'high' ? 8 : quality === 'medium' ? 5 : 3
  const nFaroles = quality === 'high' ? 8 : quality === 'medium' ? 5 : 3

  const bancas = useMemo(
    () =>
      Array.from({ length: nBancas }, (_, i) => {
        const a = (i / nBancas) * Math.PI * 2 + 0.35
        const r = RADIO_CAMINO + 2.9
        return { pos: [Math.cos(a) * r, 0, Math.sin(a) * r] as [number, number, number], giro: -a + Math.PI / 2 }
      }),
    [nBancas]
  )

  const faroles = useMemo(
    () =>
      Array.from({ length: nFaroles }, (_, i) => {
        const a = (i / nFaroles) * Math.PI * 2
        const r = RADIO_CAMINO + 1.1
        return [Math.cos(a) * r, 0, Math.sin(a) * r] as [number, number, number]
      }),
    [nFaroles]
  )

  return (
    <group>
      {bancas.map((b, i) => (
        <Banca key={`banca-${i}`} position={b.pos} giro={b.giro} />
      ))}
      {faroles.map((p, i) => (
        <Farol key={`farol-${i}`} position={p} />
      ))}
      <Fuente position={[-14.5, 0, -12.5]} />
    </group>
  )
}
