import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'

const LETRAS = ['A', 'B', 'C', 'E', 'H', 'L', 'N', 'O', 'R', 'S', 'T', 'W', 'Y', 'G']
const LETRA_COLORS = ['#525fe1', '#f26b65', '#FF7700', '#8b93f8', '#22c55e', '#f9a03f']
const STAR_COLORS = [0x525fe1, 0xf26b65, 0xff7700, 0xf9a03f, 0x22c55e, 0xffd166]

interface PlaneData {
  radius: number
  height: number
  speed: number
  phase: number
  tilt: number
}

/** Lluvia de estrellas de colores que cae suave sobre el campus. */
function StarRain({ count }: { count: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const speeds = useMemo(() => {
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) s[i] = 1.2 + Math.random() * 2.2
    return s
  }, [count])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 42
      const a = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 6 + Math.random() * 22
      pos[i * 3 + 2] = Math.sin(a) * r
      c.setHex(STAR_COLORS[i % STAR_COLORS.length])
      col[i * 3] = c.r
      col[i * 3 + 1] = c.g
      col[i * 3 + 2] = c.b
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [count])

  const mat = useMemo(
    () =>
      // Puntitos discretos. Con size 0.22 los mas cercanos se veian como
      // cuadros de colores flotando encima del campus, no como destellos.
      new THREE.PointsMaterial({
        size: 0.11,
        vertexColors: true,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  )

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= speeds[i] * delta
      arr[i * 3] += Math.sin(state.clock.elapsedTime * 1.5 + i) * delta * 0.4
      if (arr[i * 3 + 1] < 0.3) arr[i * 3 + 1] = 24 + Math.random() * 6
    }
    pos.needsUpdate = true
    ;(pointsRef.current.material as THREE.PointsMaterial).size = 0.1 + Math.sin(state.clock.elapsedTime * 3) * 0.025
  })

  return <points ref={pointsRef} geometry={geo} material={mat} frustumCulled={false} />
}

/** Aviones de papel, letras flotantes (siempre de frente) y lluvia de estrellas. */
export function AcademiaAtmosphere({ quality }: ThemeAtmosphereProps) {
  const planesRef = useRef<THREE.Group>(null)
  const lettersRef = useRef<THREE.Group>(null)

  const planeCount = quality === 'high' ? 6 : quality === 'medium' ? 4 : 3
  const letterCount = quality === 'high' ? 12 : quality === 'medium' ? 9 : 6
  const starCount = quality === 'high' ? 160 : quality === 'medium' ? 100 : 60

  const planes = useMemo<PlaneData[]>(() => {
    const list: PlaneData[] = []
    for (let i = 0; i < planeCount; i++) {
      list.push({
        radius: 14 + ((i * 9) % 18),
        height: 7 + ((i * 5) % 8),
        speed: 0.16 + ((i * 3) % 10) / 45,
        phase: (i / planeCount) * Math.PI * 2,
        tilt: 0.15 + ((i * 7) % 10) / 40,
      })
    }
    return list
  }, [planeCount])

  const letters = useMemo(() => {
    const list: { letra: string; c: string; r: number; a: number; h: number; speed: number }[] = []
    for (let i = 0; i < letterCount; i++) {
      list.push({
        letra: LETRAS[i % LETRAS.length],
        c: LETRA_COLORS[i % LETRA_COLORS.length],
        r: 12 + ((i * 11) % 24),
        a: (i / letterCount) * Math.PI * 2,
        h: 3 + ((i * 7) % 9),
        speed: 0.25 + ((i * 3) % 10) / 30,
      })
    }
    return list
  }, [letterCount])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (planesRef.current) {
      planesRef.current.children.forEach((p, i) => {
        const data = planes[i % planes.length]
        const a = t * data.speed + data.phase
        p.position.set(Math.cos(a) * data.radius, data.height + Math.sin(t * 0.8 + data.phase) * 1.2, Math.sin(a) * data.radius)
        p.rotation.y = -a
        p.rotation.z = data.tilt + Math.sin(t + data.phase) * 0.1
      })
    }
    if (lettersRef.current) {
      lettersRef.current.children.forEach((l, i) => {
        const data = letters[i % letters.length]
        l.position.y = data.h + Math.sin(t * data.speed * 2 + i) * 0.9
      })
    }
  })

  return (
    <>
      <StarRain count={starCount} />

      {/* Aviones de papel */}
      <group ref={planesRef}>
        {planes.map((_, i) => (
          <group key={`plane-${i}`}>
            <mesh rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.22, 0.9, 4]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[-0.18, -0.05, 0]} rotation={[0.5, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.3, 0.7, 3]} />
              <meshStandardMaterial color="#ecedff" roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Letras flotantes: en Billboard para que SIEMPRE se lean de frente */}
      <group ref={lettersRef}>
        {letters.map((l, i) => (
          <group key={`letter-${i}`} position={[Math.cos(l.a) * l.r, l.h, Math.sin(l.a) * l.r]}>
            <Billboard>
              <Text fontSize={0.95} color={l.c} anchorX="center" anchorY="middle" fontWeight="bold" outlineWidth={0.05} outlineColor="#ffffff">
                {l.letra}
              </Text>
            </Billboard>
          </group>
        ))}
      </group>
    </>
  )
}
