import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeBuildingProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

const BOOK_COLORS = ['#525fe1', '#f26b65', '#FF7700', '#8b93f8', '#1a2d62', '#f9a03f']
const BLOCK_COLORS = ['#f26b65', '#525fe1', '#f9a03f', '#22c55e', '#8b93f8']

interface VariantProps {
  w: number
  h: number
  d: number
  color: string
  label: string
  seed: number
}

/* ---------- Variante: torre de libros ---------- */
function Libros({ w, h, d, seed }: VariantProps) {
  const bookCount = Math.max(3, Math.round(h / 1.1))
  const bookH = h / bookCount
  const books = useMemo(() => {
    const list: { rot: number; off: number; c: string }[] = []
    for (let i = 0; i < bookCount; i++) {
      list.push({ rot: Math.sin(seed + i * 2.1) * 0.22, off: Math.cos(seed + i * 1.7) * 0.14, c: BOOK_COLORS[i % BOOK_COLORS.length] })
    }
    return list
  }, [bookCount, seed])
  return (
    <>
      {books.map((b, i) => (
        <group key={i} position={[b.off, 0.16 + i * bookH + bookH / 2, 0]} rotation={[0, b.rot, 0]}>
          <mesh castShadow>
            <boxGeometry args={[w * 1.55, bookH * 0.86, d * 1.05]} />
            <meshStandardMaterial color={b.c} roughness={0.55} />
          </mesh>
          <mesh position={[w * 0.06, 0, 0]}>
            <boxGeometry args={[w * 1.48, bookH * 0.68, d * 1.08]} />
            <meshStandardMaterial color="#fdfdf6" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/* ---------- Variante: edificio de escuela ---------- */
function Edificio({ w, h, d, color }: VariantProps) {
  const floors = Math.max(2, Math.round(h / 1.6))
  const windows = useMemo(() => {
    const list: [number, number][] = []
    for (let f = 0; f < floors; f++) for (let c = -1; c <= 1; c++) list.push([c * w * 0.5, 0.9 + f * (h / floors)])
    return list
  }, [floors, w, h])
  return (
    <>
      <mesh position={[0, h / 2 + 0.16, 0]} castShadow>
        <boxGeometry args={[w * 1.9, h, d * 1.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {windows.map(([wx, wy], i) => (
        <mesh key={i} position={[wx, wy, (d * 1.5) / 2 + 0.02]}>
          <planeGeometry args={[w * 0.34, 0.5]} />
          <meshStandardMaterial color="#fff7d6" emissive="#ffe9a3" emissiveIntensity={0.35} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.55, (d * 1.5) / 2 + 0.02]}>
        <planeGeometry args={[w * 0.5, 1.0]} />
        <meshStandardMaterial color="#1a2d62" roughness={0.6} />
      </mesh>
      <mesh position={[0, h + 0.16 + 0.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[w * 1.55, 1.1, 4]} />
        <meshStandardMaterial color="#1a2d62" roughness={0.65} />
      </mesh>
    </>
  )
}

/* ---------- Variante: lápiz gigante ---------- */
function Lapiz({ w, h, color }: VariantProps) {
  const r = Math.max(0.55, w * 0.55)
  return (
    <>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[r * 1.05, r * 1.05, 0.6, 12]} />
        <meshStandardMaterial color="#f7a8b8" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.75 + (h - 1.9) / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r, h - 1.9, 6]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, h - 1.15 + 0.55, 0]} castShadow>
        <coneGeometry args={[r, 1.1, 6]} />
        <meshStandardMaterial color="#e7cfa2" roughness={0.85} />
      </mesh>
      <mesh position={[0, h - 0.05, 0]}>
        <coneGeometry args={[r * 0.32, 0.42, 6]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} />
      </mesh>
    </>
  )
}

/* ---------- Variante: bloques ABC ---------- */
function Bloques({ w, h, label, seed }: VariantProps) {
  const n = Math.max(2, Math.min(5, Math.round(h / 1.5)))
  const size = Math.max(1.3, w * 1.25)
  const letras = useMemo(() => {
    const clean = (label || 'ABC').replace(/[^A-ZÁÉÍÓÚÑ0-9]/gi, '').toUpperCase()
    const list: string[] = []
    for (let i = 0; i < n; i++) list.push(clean[i % clean.length] ?? 'A')
    return list
  }, [label, n])
  return (
    <>
      {letras.map((letra, i) => (
        <group key={i} position={[Math.cos(seed + i * 2.4) * 0.16, 0.16 + i * size + size / 2, 0]} rotation={[0, Math.sin(seed + i * 1.9) * 0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[size, size * 0.96, size]} />
            <meshStandardMaterial color={BLOCK_COLORS[(i + Math.round(seed)) % BLOCK_COLORS.length]} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, size / 2 + 0.015]}>
            <planeGeometry args={[size * 0.78, size * 0.78]} />
            <meshStandardMaterial color="#fdfdf6" roughness={0.85} />
          </mesh>
          <Text position={[0, 0, size / 2 + 0.03]} fontSize={size * 0.5} color="#1a2d62" anchorX="center" anchorY="middle" fontWeight="bold">
            {letra}
          </Text>
        </group>
      ))}
    </>
  )
}

/* ---------- Variante: globo aerostático ---------- */
function Globo({ w, h, color, seed }: VariantProps) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (ref.current) ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8 + seed) * 0.35
  })
  const balloonR = Math.max(1.5, w * 1.35)
  return (
    <group ref={ref}>
      <mesh position={[0, h + balloonR * 0.9, 0]} castShadow>
        <sphereGeometry args={[balloonR, 20, 20]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      <mesh position={[0, h + balloonR * 0.9, 0]} scale={[1.004, 0.35, 1.004]}>
        <sphereGeometry args={[balloonR, 20, 20]} />
        <meshStandardMaterial color="#fdfdf6" roughness={0.5} />
      </mesh>
      {[...Array(4)].map((_, i) => (
        <mesh
          key={i}
          position={[Math.cos((i / 4) * Math.PI * 2) * balloonR * 0.5, h + balloonR * 0.12, Math.sin((i / 4) * Math.PI * 2) * balloonR * 0.5]}
          rotation={[0, 0, Math.cos((i / 4) * Math.PI * 2) * 0.35]}
        >
          <cylinderGeometry args={[0.02, 0.02, balloonR * 0.85, 4]} />
          <meshStandardMaterial color="#6b4a2b" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, h - 0.4, 0]} castShadow>
        <boxGeometry args={[w * 1.1, 0.8, w * 1.1]} />
        <meshStandardMaterial color="#8a6134" roughness={0.9} />
      </mesh>
    </group>
  )
}

/**
 * Estación del campus con cinco variantes visuales: torre de libros,
 * edificio de escuela, lápiz gigante, bloques ABC o globo aerostático.
 * Se elige con config.variant; todas llevan banderín y rótulo de pizarra.
 */
export function AcademiaBuilding({ config, entranceDuration = 1 }: ThemeBuildingProps) {
  const groupRef = useRef<THREE.Group>(null)
  const flagRef = useRef<THREE.Mesh>(null)

  const [x, , z] = config.position
  const [w, h, d] = config.size
  const color = config.color ?? '#525fe1'
  const delay = config.entranceDelay ?? 0
  const variant = config.variant ?? 'libros'
  const bass = useAudioStore((state) => state.analysis.bass)
  const seed = useMemo(() => Math.random() * Math.PI * 2, [])

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0.01, y: 0.01, z: 0.01 },
      { x: 1, y: 1, z: 1, duration: entranceDuration * 0.9, delay, ease: 'back.out(1.5)' }
    )
  }, [entranceDuration, delay])

  useFrame((state) => {
    if (flagRef.current) flagRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2 + seed) * 0.25
    if (groupRef.current) {
      const s = 1 + bass * 0.02
      groupRef.current.scale.x = s
      groupRef.current.scale.z = s
    }
  })

  const vp: VariantProps = { w, h, d, color, label: config.label ?? '', seed }
  const esGlobo = variant === 'globo'
  const signY = esGlobo ? h + Math.max(1.5, w * 1.35) * 2 + 0.9 : h + 3
  const flagY = esGlobo ? 0 : 0.16 + h + 1.05

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      {!esGlobo && (
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <cylinderGeometry args={[Math.max(w, d) * 1.15, Math.max(w, d) * 1.25, 0.16, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      )}

      {variant === 'edificio' && <Edificio {...vp} />}
      {variant === 'lapiz' && <Lapiz {...vp} />}
      {variant === 'bloques' && <Bloques {...vp} />}
      {variant === 'globo' && <Globo {...vp} />}
      {(variant === 'libros' || !['edificio', 'lapiz', 'bloques', 'globo'].includes(variant)) && <Libros {...vp} />}

      {!esGlobo && (
        <>
          <mesh position={[0, flagY, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.055, 2.1, 8]} />
            <meshStandardMaterial color="#1a2d62" roughness={0.5} />
          </mesh>
          <mesh ref={flagRef} position={[0.62, flagY + 0.7, 0]}>
            <coneGeometry args={[0.34, 1.15, 3]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {config.label && (
        <Billboard position={[0, signY, 0]}>
          <mesh>
            <planeGeometry args={[Math.max(2.8, config.label.length * 0.38), 1.05]} />
            <meshStandardMaterial color="#1a2d62" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[Math.max(2.8, config.label.length * 0.38) + 0.16, 1.21]} />
            <meshStandardMaterial color="#ffffff" roughness={0.7} />
          </mesh>
          <Text position={[0, 0, 0.02]} fontSize={0.4} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
            {config.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
