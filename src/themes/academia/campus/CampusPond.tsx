import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { QualityLevel } from '../../../types/presentation'
import { LAGUNA, LAGUNA_R } from './layout'
import { makeRng, pick, range } from './rng'

/* Geometrias compartidas de la laguna. */
const GEO = {
  agua: new THREE.CircleGeometry(1, 40),
  piedra: new THREE.DodecahedronGeometry(1, 0),
  hoja: new THREE.CircleGeometry(0.55, 10),
  florNenufar: new THREE.SphereGeometry(0.12, 8, 6),
  junco: new THREE.ConeGeometry(0.07, 1.6, 4),
  cuerpoPato: new THREE.SphereGeometry(0.3, 12, 10),
  cabezaPato: new THREE.SphereGeometry(0.16, 10, 8),
  picoPato: new THREE.ConeGeometry(0.07, 0.22, 6),
  cuelloPato: new THREE.CylinderGeometry(0.08, 0.1, 0.24, 6),
  estela: new THREE.RingGeometry(0.9, 1.05, 20, 1, 0, Math.PI),
  tablon: new THREE.BoxGeometry(0.55, 0.08, 2.6),
  baranda: new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6),
  poste: new THREE.CylinderGeometry(0.07, 0.07, 0.9, 6),
  alaLibelula: new THREE.CircleGeometry(0.13, 6),
  cuerpoLibelula: new THREE.CapsuleGeometry(0.035, 0.24, 3, 6),
}

const MAT = {
  agua: new THREE.MeshStandardMaterial({
    color: '#5aa9d6',
    roughness: 0.08,
    metalness: 0.55,
    transparent: true,
    opacity: 0.9,
  }),
  fondo: new THREE.MeshStandardMaterial({ color: '#3d6f57', roughness: 1 }),
  piedra: new THREE.MeshStandardMaterial({ color: '#b9b3a6', roughness: 1, flatShading: true }),
  hoja: new THREE.MeshStandardMaterial({ color: '#4f9d52', roughness: 0.85, side: THREE.DoubleSide }),
  flor: new THREE.MeshStandardMaterial({ color: '#ff8fa3', roughness: 0.6 }),
  junco: new THREE.MeshStandardMaterial({ color: '#5f9e4a', roughness: 0.95 }),
  patoCuerpo: new THREE.MeshStandardMaterial({ color: '#f6f2e8', roughness: 0.85 }),
  patoCabeza: new THREE.MeshStandardMaterial({ color: '#2f6b4f', roughness: 0.7 }),
  patoPico: new THREE.MeshStandardMaterial({ color: '#f0a63c', roughness: 0.55 }),
  estela: new THREE.MeshBasicMaterial({ color: '#eaf6ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  madera: new THREE.MeshStandardMaterial({ color: '#a4703f', roughness: 0.92 }),
  libelulaAla: new THREE.MeshStandardMaterial({
    color: '#cfe9ff',
    roughness: 0.2,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  }),
  libelulaCuerpo: new THREE.MeshStandardMaterial({
    color: '#2fb6c9',
    roughness: 0.4,
    emissive: '#2fb6c9',
    emissiveIntensity: 0.3,
  }),
}

/** Ondas que se abren en el agua, como si algo se acabara de mover. */
function Ondas({ n }: { n: number }) {
  const grupo = useRef<THREE.Group>(null)
  const datos = useMemo(() => {
    const rng = makeRng(808)
    return Array.from({ length: n }, () => ({
      x: range(rng, -LAGUNA_R * 0.6, LAGUNA_R * 0.6),
      z: range(rng, -LAGUNA_R * 0.6, LAGUNA_R * 0.6),
      fase: rng() * 4,
      velocidad: range(rng, 0.35, 0.6),
    }))
  }, [n])

  useFrame((state) => {
    if (!grupo.current) return
    const t = state.clock.elapsedTime
    grupo.current.children.forEach((c, i) => {
      const d = datos[i % datos.length]
      const ciclo = ((t * d.velocidad + d.fase) % 1)
      const s = 0.3 + ciclo * 3.2
      c.scale.set(s, s, 1)
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial
      m.opacity = 0.3 * (1 - ciclo)
    })
  })

  return (
    <group ref={grupo}>
      {datos.map((d, i) => (
        <mesh key={`onda-${i}`} position={[d.x, 0.035, d.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.85, 1, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

/** Un pato nadando en circulo, con su estela detras. */
function Pato({ radio, velocidad, fase, colorCabeza }: { radio: number; velocidad: number; fase: number; colorCabeza: string }) {
  const grupo = useRef<THREE.Group>(null)
  const cabeza = useRef<THREE.Group>(null)

  const matCabeza = useMemo(
    () => new THREE.MeshStandardMaterial({ color: colorCabeza, roughness: 0.7 }),
    [colorCabeza]
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const a = fase + t * velocidad
    if (grupo.current) {
      grupo.current.position.set(Math.cos(a) * radio, 0.06 + Math.sin(t * 1.6 + fase) * 0.025, Math.sin(a) * radio)
      grupo.current.rotation.y = -a + Math.PI / 2
    }
    // De vez en cuando mete la cabeza al agua a buscar comida.
    if (cabeza.current) {
      const picotea = Math.sin(t * 0.7 + fase)
      cabeza.current.rotation.x = picotea > 0.86 ? (picotea - 0.86) * 6 : 0
    }
  })

  return (
    // Agrandados: la laguna esta lejos de la camara y a escala real los patos
    // serian tres pixeles blancos sobre el agua.
    <group ref={grupo} scale={1.8}>
      <mesh geometry={GEO.cuerpoPato} material={MAT.patoCuerpo} scale={[1, 0.72, 1.45]} castShadow />
      {/* La cola, un poquito levantada */}
      <mesh geometry={GEO.cuerpoPato} material={MAT.patoCuerpo} position={[0, 0.06, -0.35]} scale={[0.42, 0.3, 0.5]} />
      <group ref={cabeza} position={[0, 0.14, 0.24]}>
        <mesh geometry={GEO.cuelloPato} material={matCabeza} position={[0, 0.1, 0]} rotation={[0.25, 0, 0]} />
        <mesh geometry={GEO.cabezaPato} material={matCabeza} position={[0, 0.26, 0.05]} />
        <mesh geometry={GEO.picoPato} material={MAT.patoPico} position={[0, 0.24, 0.2]} rotation={[Math.PI / 2, 0, 0]} />
      </group>
      <mesh geometry={GEO.estela} material={MAT.estela} position={[0, -0.02, -0.5]} rotation={[-Math.PI / 2, 0, Math.PI]} scale={[0.9, 1.6, 1]} />
    </group>
  )
}

/** Libelula suspendida sobre el agua. */
function Libelula({ base, fase }: { base: [number, number, number]; fase: number }) {
  const grupo = useRef<THREE.Group>(null)
  const alas = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (grupo.current) {
      // Se queda quieta, se va de golpe y se vuelve a quedar quieta.
      const salto = Math.floor(t * 0.35 + fase)
      const rng = Math.sin(salto * 12.9898) * 43758.5453
      const dx = ((rng % 1) + 1) % 1
      const dz = ((rng * 1.7) % 1 + 1) % 1
      const objetivoX = base[0] + (dx - 0.5) * 5
      const objetivoZ = base[2] + (dz - 0.5) * 5
      grupo.current.position.x += (objetivoX - grupo.current.position.x) * 0.045
      grupo.current.position.z += (objetivoZ - grupo.current.position.z) * 0.045
      grupo.current.position.y = base[1] + Math.sin(t * 2.4 + fase) * 0.12
      grupo.current.rotation.y = Math.atan2(objetivoX - grupo.current.position.x, objetivoZ - grupo.current.position.z)
    }
    if (alas.current) {
      const flap = Math.sin(t * 26 + fase) * 0.5
      alas.current.children[0].rotation.x = flap
      alas.current.children[1].rotation.x = -flap
    }
  })

  return (
    <group ref={grupo} position={base}>
      <mesh geometry={GEO.cuerpoLibelula} material={MAT.libelulaCuerpo} rotation={[Math.PI / 2, 0, 0]} />
      <group ref={alas}>
        <group>
          <mesh geometry={GEO.alaLibelula} material={MAT.libelulaAla} position={[0.14, 0.02, 0]} rotation={[0, 0, 0]} scale={[1.6, 0.7, 1]} />
        </group>
        <group>
          <mesh geometry={GEO.alaLibelula} material={MAT.libelulaAla} position={[-0.14, 0.02, 0]} rotation={[0, 0, 0]} scale={[1.6, 0.7, 1]} />
        </group>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Peces: sombras de colores girando bajo la superficie                 */
/* ------------------------------------------------------------------ */

/** Cuerpo alargado con cola, apuntando hacia +Z (el sentido de la marcha). */
const GEO_PEZ = (() => {
  const cuerpo = new THREE.CapsuleGeometry(0.11, 0.22, 3, 7)
  cuerpo.rotateX(Math.PI / 2)
  const cola = new THREE.ConeGeometry(0.13, 0.2, 3)
  cola.scale(1, 1, 0.25)
  cola.rotateX(-Math.PI / 2)
  cola.translate(0, 0, -0.26)
  const merged = mergeGeometries([cuerpo, cola]) ?? cuerpo.clone()
  cuerpo.dispose()
  cola.dispose()
  return merged
})()

const COLORES_PEZ = ['#f28f3b', '#e8543f', '#f2c14e', '#d9d9d9', '#e07a5f']

function Peces({ n }: { n: number }) {
  const malla = useRef<THREE.InstancedMesh>(null)

  const peces = useMemo(() => {
    const rng = makeRng(7373)
    return Array.from({ length: n }, () => ({
      radio: range(rng, 1.1, LAGUNA_R - 1.9),
      // La profundidad importa: todos al mismo nivel se veian como calcomanias
      // pegadas al fondo en vez de un cardumen.
      hondura: range(rng, -0.16, -0.04),
      velocidad: (rng() > 0.5 ? 1 : -1) * range(rng, 0.22, 0.55),
      fase: rng() * Math.PI * 2,
      escala: range(rng, 0.8, 1.4),
      color: new THREE.Color(pick(rng, COLORES_PEZ)),
    }))
  }, [n])

  useLayoutEffect(() => {
    if (!malla.current) return
    peces.forEach((p, i) => malla.current!.setColorAt(i, p.color))
    if (malla.current.instanceColor) malla.current.instanceColor.needsUpdate = true
  }, [peces])

  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3() }),
    []
  )

  useFrame((state) => {
    if (!malla.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < peces.length; i++) {
      const pez = peces[i]
      const a = pez.fase + t * pez.velocidad
      tmp.p.set(Math.cos(a) * pez.radio, pez.hondura, Math.sin(a) * pez.radio)
      // Nariz hacia donde nada, y un coleteo lateral que se nota desde arriba.
      tmp.e.set(0, -a + (pez.velocidad > 0 ? Math.PI / 2 : -Math.PI / 2), Math.sin(t * 6 + pez.fase) * 0.22)
      tmp.s.setScalar(pez.escala)
      tmp.m.compose(tmp.p, tmp.q.setFromEuler(tmp.e), tmp.s)
      malla.current.setMatrixAt(i, tmp.m)
    }
    malla.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={malla} args={[GEO_PEZ, undefined, Math.max(1, n)]}>
      <meshStandardMaterial roughness={0.45} metalness={0.1} />
    </instancedMesh>
  )
}

interface CampusPondProps {
  quality: QualityLevel
}

/**
 * La laguna del campus: agua, piedras, nenufares, juncos, patos nadando,
 * libelulas y un puentecito de madera.
 *
 * Sirve para dos cosas: da un punto de brillo y movimiento en un costado que
 * antes era puro zacate, y le pone escala al campus (los patos son diminutos
 * al lado de los edificios).
 */
export function CampusPond({ quality }: CampusPondProps) {
  const [cx, cz] = LAGUNA
  const nPiedras = quality === 'high' ? 38 : quality === 'medium' ? 22 : 9
  const nHojas = quality === 'high' ? 26 : quality === 'medium' ? 14 : 5
  const nJuncos = quality === 'high' ? 56 : quality === 'medium' ? 30 : 10
  const nPatos = quality === 'high' ? 6 : quality === 'medium' ? 4 : 2
  const nPeces = quality === 'high' ? 16 : quality === 'medium' ? 9 : 4
  const nLibelulas = quality === 'high' ? 7 : quality === 'medium' ? 3 : 0
  const nOndas = quality === 'high' ? 8 : 3

  const piedras = useRef<THREE.InstancedMesh>(null)
  const hojas = useRef<THREE.InstancedMesh>(null)
  const juncos = useRef<THREE.InstancedMesh>(null)

  const nenufares = useMemo(() => {
    const rng = makeRng(4488)
    return Array.from({ length: Math.round(nHojas / 3) }, () => {
      const a = rng() * Math.PI * 2
      const r = range(rng, 1.2, LAGUNA_R - 1.6)
      return [Math.cos(a) * r, 0.1, Math.sin(a) * r] as [number, number, number]
    })
  }, [nHojas])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    const rng = makeRng(9090)

    // Piedras del borde
    if (piedras.current) {
      for (let i = 0; i < nPiedras; i++) {
        const a = (i / nPiedras) * Math.PI * 2 + range(rng, -0.08, 0.08)
        const r = LAGUNA_R + range(rng, -0.35, 0.55)
        const t = range(rng, 0.32, 0.72)
        p.set(Math.cos(a) * r, t * 0.35, Math.sin(a) * r)
        e.set(rng() * 3, rng() * 3, rng() * 3)
        s.set(t, t * 0.7, t)
        m.compose(p, q.setFromEuler(e), s)
        piedras.current.setMatrixAt(i, m)
      }
      piedras.current.instanceMatrix.needsUpdate = true
    }

    // Nenufares
    if (hojas.current) {
      for (let i = 0; i < nHojas; i++) {
        const a = rng() * Math.PI * 2
        const r = range(rng, 0.9, LAGUNA_R - 1.3)
        const t = range(rng, 0.7, 1.3)
        p.set(Math.cos(a) * r, 0.055, Math.sin(a) * r)
        e.set(-Math.PI / 2, 0, rng() * Math.PI)
        s.set(t, t, t)
        m.compose(p, q.setFromEuler(e), s)
        hojas.current.setMatrixAt(i, m)
      }
      hojas.current.instanceMatrix.needsUpdate = true
    }

    // Juncos en la orilla
    if (juncos.current) {
      for (let i = 0; i < nJuncos; i++) {
        const a = rng() * Math.PI * 2
        const r = LAGUNA_R + range(rng, -0.9, 1.1)
        const t = range(rng, 0.6, 1.35)
        p.set(Math.cos(a) * r, 0.7 * t, Math.sin(a) * r)
        e.set(range(rng, -0.16, 0.16), rng() * 3, range(rng, -0.16, 0.16))
        s.set(t, t, t)
        m.compose(p, q.setFromEuler(e), s)
        juncos.current.setMatrixAt(i, m)
      }
      juncos.current.instanceMatrix.needsUpdate = true
    }
  }, [nPiedras, nHojas, nJuncos])

  return (
    <group position={[cx, 0, cz]}>
      {/* El fondo, un poco mas hondo, para que el agua no se vea hueca */}
      <mesh geometry={GEO.agua} material={MAT.fondo} position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[LAGUNA_R * 0.98, LAGUNA_R * 0.98, 1]} />
      {/* El agua */}
      <mesh geometry={GEO.agua} material={MAT.agua} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[LAGUNA_R, LAGUNA_R, 1]} receiveShadow />

      <Ondas n={nOndas} />

      <instancedMesh ref={piedras} args={[GEO.piedra, MAT.piedra, nPiedras]} castShadow receiveShadow />
      <instancedMesh ref={hojas} args={[GEO.hoja, MAT.hoja, nHojas]} />
      <instancedMesh ref={juncos} args={[GEO.junco, MAT.junco, nJuncos]} castShadow />

      {nenufares.map((p, i) => (
        <mesh key={`nen-${i}`} geometry={GEO.florNenufar} material={MAT.flor} position={p} scale={1.1} />
      ))}

      <Peces n={nPeces} />

      {Array.from({ length: nPatos }, (_, i) => (
        <Pato
          key={`pato-${i}`}
          // Anillos mas juntos que antes: con seis patos, el paso de 1.1 sacaba
          // al ultimo fuera del agua.
          radio={1.6 + i * 0.95}
          velocidad={(i % 2 === 0 ? 1 : -1) * (0.13 + i * 0.025)}
          fase={i * 2.1}
          colorCabeza={pick(makeRng(100 + i), ['#2f6b4f', '#3a5f8a', '#6b4a34'])}
        />
      ))}

      {Array.from({ length: nLibelulas }, (_, i) => (
        <Libelula key={`lib-${i}`} base={[Math.cos(i * 1.9) * 3, 0.9, Math.sin(i * 1.9) * 3]} fase={i * 1.3} />
      ))}

      {/* Puentecito de madera cruzando la orilla */}
      <group position={[0, 0, LAGUNA_R - 0.6]} rotation={[0, 0.12, 0]}>
        {[-1.2, -0.6, 0, 0.6, 1.2].map((x, i) => (
          <mesh key={`tablon-${i}`} geometry={GEO.tablon} material={MAT.madera} position={[x, 0.5, 0]} castShadow />
        ))}
        <mesh geometry={GEO.baranda} material={MAT.madera} position={[-1.5, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={GEO.baranda} material={MAT.madera} position={[1.5, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} />
        {[-1.2, 1.2].map((z, i) => (
          <group key={`postes-${i}`}>
            <mesh geometry={GEO.poste} material={MAT.madera} position={[-1.5, 0.45, z]} castShadow />
            <mesh geometry={GEO.poste} material={MAT.madera} position={[1.5, 0.45, z]} castShadow />
          </group>
        ))}
      </group>
    </group>
  )
}
