import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Rng } from '../procedural/math'
import { tube } from '../procedural/geometry'
import type { QualityLevel } from '../../../types/presentation'

interface AbyssalCityProps {
  quality: QualityLevel
}

function hexTowerGeometries(rng: Rng, floors: number, radius: number) {
  const bodyParts: THREE.BufferGeometry[] = []
  const windowParts: THREE.BufferGeometry[] = []
  const h = floors * rng.range(1.8, 2.6)
  const body = new THREE.CylinderGeometry(radius, radius * 1.15, h, 6, 1)
  body.translate(0, h / 2, 0)
  bodyParts.push(body)
  const winCount = Math.floor(h / 1.2)
  for (let i = 0; i < winCount; i++) {
    for (let f = 0; f < 6; f++) {
      if (rng.next() > 0.55) continue
      const a = (f / 6) * Math.PI * 2
      const wx = Math.cos(a) * (radius + 0.04)
      const wz = Math.sin(a) * (radius + 0.04)
      const wy = 1 + i * 1.2
      const win = new THREE.BoxGeometry(0.16, 0.28, 0.04)
      win.rotateY(-a)
      win.translate(wx, wy, wz)
      windowParts.push(win)
    }
  }
  const cap = new THREE.SphereGeometry(radius * 0.9, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  cap.translate(0, h, 0)
  bodyParts.push(cap)
  return {
    body: mergeGeometries(bodyParts, false),
    windows: windowParts.length > 0 ? mergeGeometries(windowParts, false) : null,
    height: h,
  }
}

function centralCoreGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const base = new THREE.CylinderGeometry(2.2, 2.8, 6, 8, 1)
  base.translate(0, 3, 0)
  parts.push(base)
  const ring = new THREE.TorusGeometry(3.2, 0.15, 8, 64)
  ring.rotateX(Math.PI / 2)
  ring.translate(0, 4, 0)
  parts.push(ring)
  return mergeGeometries(parts, false)
}

export function AbyssalCity({ quality }: AbyssalCityProps) {
  const rng = useMemo(() => new Rng(20260729), [])
  const buildingCount = quality === 'low' ? 18 : quality === 'medium' ? 32 : 48
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const groupRef = useRef<THREE.Group>(null)

  const towers = useMemo(() => {
    return Array.from({ length: buildingCount }, () => {
      const angle = rng.next() * Math.PI * 2
      const r = 10 + Math.pow(rng.next(), 0.6) * 50
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const floors = rng.rangeInt(3, 10)
      const radius = rng.range(0.7, 1.8)
      const windowColorHex = rng.pick([0xf59e0b, 0x0ea5e9, 0xa855f7, 0x34d399])
      const { body, windows, height } = hexTowerGeometries(rng, floors, radius)
      dummy.position.set(x, -1.2, z)
      dummy.rotation.set(0, rng.next() * Math.PI * 2, 0)
      const s = rng.range(0.9, 1.4)
      dummy.scale.set(s, rng.range(0.9, 1.6), s)
      dummy.updateMatrix()
      return {
        matrix: dummy.matrix.clone(),
        body,
        windows,
        height,
        color: new THREE.Color(windowColorHex).offsetHSL(rng.range(-0.05, 0.05), 0, rng.range(-0.1, 0.1)),
      }
    })
  }, [rng, buildingCount, dummy])

  const pipes = useMemo(() => {
    const parts: THREE.BufferGeometry[] = []
    const positions = towers.slice(0, Math.min(towers.length, 16)).map((t) => new THREE.Vector3().setFromMatrixPosition(t.matrix))
    for (let i = 0; i < positions.length; i++) {
      if (rng.next() > 0.6) continue
      const j = Math.floor(rng.next() * positions.length)
      if (i === j) continue
      const a = positions[i].clone().setY(positions[i].y + rng.range(1, 4))
      const b = positions[j].clone().setY(positions[j].y + rng.range(1, 4))
      parts.push(tube(a, b, 0.12, 0.12, 8))
    }
    return parts.length > 0 ? mergeGeometries(parts, false) : null
  }, [towers, rng])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.008
  })

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.4 }), [])

  return (
    <group ref={groupRef}>
      <mesh position={[0, -1.2, 0]} geometry={centralCoreGeometry()} material={bodyMaterial} />
      <mesh position={[0, 4.5, 0]}>
        <icosahedronGeometry args={[1.2, 3]} />
        <meshStandardMaterial color="#ffffff" emissive="#f59e0b" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 5, 0]} color="#f59e0b" intensity={16} distance={40} decay={2} />
      {towers.map((t, i) => (
        <group key={i} matrix={t.matrix} matrixAutoUpdate={false}>
          <mesh geometry={t.body} material={bodyMaterial} />
          {t.windows && (
            <mesh geometry={t.windows}>
              <meshStandardMaterial color={t.color} emissive={t.color} emissiveIntensity={1.5} toneMapped={false} roughness={0.3} />
            </mesh>
          )}
        </group>
      ))}
      {pipes && (
        <mesh geometry={pipes}>
          <meshStandardMaterial color="#1e293b" emissive="#0ea5e9" emissiveIntensity={0.4} roughness={0.4} metalness={0.6} />
        </mesh>
      )}
    </group>
  )
}
