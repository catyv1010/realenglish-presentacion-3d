import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'
import { makeRng, pick, range } from './rng'
import { BANCAS, BANCA_ASIENTO, RADIO_CAMINO } from './layout'

/* Paleta de la gente: ropa en los colores del sitio, pieles variadas. */
const ROPA = ['#525fe1', '#f26b65', '#FF7700', '#f9a03f', '#22c55e', '#8b93f8', '#1a2d62', '#e879f9', '#0ea5e9']
const PIELES = ['#f2c9a0', '#e0a97e', '#c68863', '#a06a45', '#8d5524', '#f5d5b8']
const PELOS = ['#2b1d14', '#4a3121', '#151515', '#6b4423', '#8c6239', '#3b2f2f']
const PANTALON = ['#2f3a56', '#3f4a6b', '#1f2937', '#4b5563', '#5b4636']

/* Geometrias compartidas: se crean una sola vez para toda la aplicacion.
   Sin esto, veinte personas serian ciento sesenta geometrias distintas. */
const GEO = {
  pierna: new THREE.CylinderGeometry(0.075, 0.065, 0.72, 6),
  brazo: new THREE.CylinderGeometry(0.06, 0.055, 0.62, 6),
  torso: new THREE.CapsuleGeometry(0.19, 0.42, 4, 8),
  cabeza: new THREE.SphereGeometry(0.16, 12, 10),
  pelo: new THREE.SphereGeometry(0.168, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.62),
  mochila: new THREE.BoxGeometry(0.26, 0.32, 0.14),
  hoja: new THREE.BoxGeometry(0.3, 0.02, 0.24),
  manta: new THREE.CylinderGeometry(1.5, 1.5, 0.04, 16),
  poste: new THREE.CylinderGeometry(0.05, 0.05, 1.3, 6),
  pizarra: new THREE.BoxGeometry(2.4, 1.5, 0.08),
}

const matCache = new Map<string, THREE.MeshStandardMaterial>()
function mat(color: string, roughness = 0.75) {
  const key = `${color}|${roughness}`
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 })
    matCache.set(key, m)
  }
  return m
}

interface Colores {
  piel: string
  ropa: string
  pelo: string
  pantalon: string
  mochila: string | null
}

function coloresAlAzar(rng: () => number): Colores {
  return {
    piel: pick(rng, PIELES),
    ropa: pick(rng, ROPA),
    pelo: pick(rng, PELOS),
    pantalon: pick(rng, PANTALON),
    mochila: rng() > 0.45 ? pick(rng, ROPA) : null,
  }
}

/* ------------------------------------------------------------------ */
/* Cuerpo base. Las piernas y los brazos van en grupos aparte para que  */
/* cada pose los pueda animar por su cuenta.                            */
/* ------------------------------------------------------------------ */
interface CuerpoProps {
  colores: Colores
  piernaIzq?: React.RefObject<THREE.Group | null>
  piernaDer?: React.RefObject<THREE.Group | null>
  brazoIzq?: React.RefObject<THREE.Group | null>
  brazoDer?: React.RefObject<THREE.Group | null>
  cabezaRef?: React.RefObject<THREE.Group | null>
  sentado?: boolean
}

function Cuerpo({ colores, piernaIzq, piernaDer, brazoIzq, brazoDer, cabezaRef, sentado }: CuerpoProps) {
  const yCadera = sentado ? 0.34 : 0.72
  const yTorso = yCadera + 0.36
  const yCabeza = yTorso + 0.46

  return (
    <group>
      {/* Piernas: cuelgan desde la cadera, se giran desde arriba */}
      <group ref={piernaIzq} position={[-0.1, yCadera, 0]}>
        <mesh geometry={GEO.pierna} material={mat(colores.pantalon)} position={[0, -0.36, 0]} castShadow />
      </group>
      <group ref={piernaDer} position={[0.1, yCadera, 0]}>
        <mesh geometry={GEO.pierna} material={mat(colores.pantalon)} position={[0, -0.36, 0]} castShadow />
      </group>

      {/* Torso */}
      <mesh geometry={GEO.torso} material={mat(colores.ropa, 0.8)} position={[0, yTorso, 0]} castShadow />

      {/* Brazos */}
      <group ref={brazoIzq} position={[-0.24, yTorso + 0.2, 0]}>
        <mesh geometry={GEO.brazo} material={mat(colores.ropa, 0.8)} position={[0, -0.31, 0]} />
      </group>
      <group ref={brazoDer} position={[0.24, yTorso + 0.2, 0]}>
        <mesh geometry={GEO.brazo} material={mat(colores.ropa, 0.8)} position={[0, -0.31, 0]} />
      </group>

      {/* Cabeza y pelo */}
      <group ref={cabezaRef} position={[0, yCabeza, 0]}>
        <mesh geometry={GEO.cabeza} material={mat(colores.piel, 0.85)} castShadow />
        <mesh geometry={GEO.pelo} material={mat(colores.pelo, 0.9)} position={[0, 0.012, 0]} />
      </group>

      {colores.mochila && (
        <mesh geometry={GEO.mochila} material={mat(colores.mochila, 0.85)} position={[0, yTorso + 0.02, -0.22]} />
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Estudiante que camina por el sendero circular                        */
/* ------------------------------------------------------------------ */
function Caminante({
  radio,
  velocidad,
  fase,
  colores,
  trote = false,
}: {
  radio: number
  velocidad: number
  fase: number
  colores: Colores
  /** Trotando: zancada mas larga, mas rebote y los brazos en guardia. */
  trote?: boolean
}) {
  const grupo = useRef<THREE.Group>(null)
  const pIzq = useRef<THREE.Group>(null)
  const pDer = useRef<THREE.Group>(null)
  const bIzq = useRef<THREE.Group>(null)
  const bDer = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const a = fase + t * velocidad
    const paso = Math.sin(t * velocidad * 9)
    if (grupo.current) {
      grupo.current.position.set(Math.cos(a) * radio, Math.abs(paso) * (trote ? 0.14 : 0.045), Math.sin(a) * radio)
      // Mirando hacia donde camina.
      grupo.current.rotation.y = -a + (velocidad > 0 ? Math.PI / 2 : -Math.PI / 2)
    }
    const zancada = trote ? 1.15 : 0.7
    if (pIzq.current) pIzq.current.rotation.x = paso * zancada
    if (pDer.current) pDer.current.rotation.x = -paso * zancada
    // Al trotar los brazos van doblados y adelante, no colgando.
    const brazoBase = trote ? -0.75 : 0
    if (bIzq.current) bIzq.current.rotation.x = brazoBase - paso * (trote ? 0.7 : 0.55)
    if (bDer.current) bDer.current.rotation.x = brazoBase + paso * (trote ? 0.7 : 0.55)
  })

  return (
    <group ref={grupo}>
      <Cuerpo colores={colores} piernaIzq={pIzq} piernaDer={pDer} brazoIzq={bIzq} brazoDer={bDer} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Estudiante sentado en una banca del sendero                          */
/* ------------------------------------------------------------------ */
function EnBanca({ banca, fase, colores, leyendo, colorLibro }: {
  banca: { pos: [number, number, number]; giro: number }
  fase: number
  colores: Colores
  leyendo: boolean
  colorLibro: string
}) {
  const cabeza = useRef<THREE.Group>(null)
  const pIzq = useRef<THREE.Group>(null)
  const pDer = useRef<THREE.Group>(null)
  const bDer = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime + fase
    if (leyendo) {
      if (cabeza.current) cabeza.current.rotation.x = 0.3 + Math.sin(t * 0.5) * 0.12
    } else {
      // El que no lee mira alrededor y conversa con el de al lado.
      if (cabeza.current) cabeza.current.rotation.y = Math.sin(t * 0.6) * 0.4
      if (bDer.current) bDer.current.rotation.x = -0.35 + Math.sin(t * 1.8) * 0.3
    }
    // En una banca las piernas cuelgan: rodillas al frente, pies en el suelo.
    if (pIzq.current) pIzq.current.rotation.x = -1.5
    if (pDer.current) pDer.current.rotation.x = -1.5
  })

  return (
    // La cadera de un cuerpo sentado esta a 0.34; el asiento, a 0.44. La
    // diferencia es exactamente lo que hay que levantarlo para que se apoye.
    <group position={[banca.pos[0], BANCA_ASIENTO - 0.34, banca.pos[2]]} rotation={[0, banca.giro, 0]}>
      <Cuerpo colores={colores} sentado cabezaRef={cabeza} piernaIzq={pIzq} piernaDer={pDer} brazoDer={bDer} />
      {leyendo && (
        <group position={[0, 0.86, 0.28]} rotation={[-0.55, 0, 0]}>
          <mesh geometry={GEO.hoja} material={mat('#fdfdf6', 0.95)} position={[-0.16, 0, 0]} rotation={[0, 0, 0.18]} />
          <mesh geometry={GEO.hoja} material={mat('#fdfdf6', 0.95)} position={[0.16, 0, 0]} rotation={[0, 0, -0.18]} />
          <mesh geometry={GEO.hoja} material={mat(colorLibro, 0.6)} position={[0, -0.035, 0]} scale={[1.08, 0.7, 1.06]} />
        </group>
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Estudiante sentado leyendo: el libro abierto en las manos            */
/* ------------------------------------------------------------------ */
function Lector({
  position,
  giro,
  fase,
  colores,
  colorLibro,
}: {
  position: [number, number, number]
  giro: number
  fase: number
  colores: Colores
  colorLibro: string
}) {
  const cabeza = useRef<THREE.Group>(null)
  const libro = useRef<THREE.Group>(null)
  const pIzq = useRef<THREE.Group>(null)
  const pDer = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime + fase
    // Lee de arriba abajo, con pausas: la cabeza baja y sube despacio.
    if (cabeza.current) cabeza.current.rotation.x = 0.28 + Math.sin(t * 0.55) * 0.14
    if (libro.current) libro.current.rotation.z = Math.sin(t * 0.4) * 0.05
    // Piernas cruzadas hacia adelante, quietas.
    if (pIzq.current) pIzq.current.rotation.set(-1.35, 0.25, 0)
    if (pDer.current) pDer.current.rotation.set(-1.35, -0.25, 0)
  })

  return (
    <group position={position} rotation={[0, giro, 0]}>
      <Cuerpo colores={colores} sentado cabezaRef={cabeza} piernaIzq={pIzq} piernaDer={pDer} />
      {/* El libro abierto: dos hojas en angulo */}
      <group ref={libro} position={[0, 0.86, 0.3]} rotation={[-0.5, 0, 0]}>
        <mesh geometry={GEO.hoja} material={mat('#fdfdf6', 0.95)} position={[-0.16, 0, 0]} rotation={[0, 0, 0.18]} />
        <mesh geometry={GEO.hoja} material={mat('#fdfdf6', 0.95)} position={[0.16, 0, 0]} rotation={[0, 0, -0.18]} />
        <mesh geometry={GEO.hoja} material={mat(colorLibro, 0.6)} position={[0, -0.035, 0]} scale={[1.08, 0.7, 1.06]} />
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Grupo conversando de pie                                             */
/* ------------------------------------------------------------------ */
function Conversando({ position, giro, fase, colores }: { position: [number, number, number]; giro: number; fase: number; colores: Colores }) {
  const grupo = useRef<THREE.Group>(null)
  const bDer = useRef<THREE.Group>(null)
  const cabeza = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime + fase
    if (grupo.current) grupo.current.rotation.y = giro + Math.sin(t * 0.5) * 0.12
    // Gesticula al hablar.
    if (bDer.current) bDer.current.rotation.x = -0.5 + Math.sin(t * 2.1) * 0.45
    if (cabeza.current) cabeza.current.rotation.y = Math.sin(t * 0.8) * 0.25
  })

  return (
    <group ref={grupo} position={position}>
      <Cuerpo colores={colores} brazoDer={bDer} cabezaRef={cabeza} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Clase al aire libre: la profe, su pizarra y los alumnos en el zacate */
/* ------------------------------------------------------------------ */
function ClaseAlAireLibre({
  position,
  giro,
  semilla,
  tema,
  ejemplo,
  nAlumnos = 6,
}: {
  position: [number, number, number]
  giro: number
  /** Cada clase lleva su propia semilla: si compartieran generador, las dos
      saldrian identicas o cambiarian de gente en cada montaje de React. */
  semilla: number
  tema: string
  ejemplo: string
  nAlumnos?: number
}) {
  const brazo = useRef<THREE.Group>(null)
  const { profe, alumnos } = useMemo(() => {
    const rng = makeRng(semilla)
    return {
      profe: coloresAlAzar(rng),
      alumnos: Array.from({ length: nAlumnos }, (_, i) => ({
        colores: coloresAlAzar(rng),
        pos: [range(rng, -2.1, 2.1), 0, 2.4 + Math.floor(i / 3) * 1.35] as [number, number, number],
        fase: rng() * 6,
        libro: pick(rng, ROPA),
      })),
    }
  }, [semilla, nAlumnos])

  useFrame((state) => {
    // La profe señala la pizarra.
    if (brazo.current) brazo.current.rotation.z = -0.9 + Math.sin(state.clock.elapsedTime * 0.9) * 0.25
  })

  return (
    <group position={position} rotation={[0, giro, 0]}>
      {/* Pizarra */}
      <mesh geometry={GEO.poste} material={mat('#8a6134', 0.9)} position={[-0.9, 0.65, 0]} castShadow />
      <mesh geometry={GEO.poste} material={mat('#8a6134', 0.9)} position={[0.9, 0.65, 0]} castShadow />
      <mesh geometry={GEO.pizarra} material={mat('#1f3d2b', 0.85)} position={[0, 1.85, 0]} castShadow />
      <Text position={[0, 2.05, 0.06]} fontSize={0.3} color="#eaf7ee" anchorX="center" anchorY="middle" fontWeight="bold">
        {tema}
      </Text>
      <Text position={[0, 1.62, 0.06]} fontSize={0.19} color="#bfe6cc" anchorX="center" anchorY="middle">
        {ejemplo}
      </Text>

      {/* La profe, de pie al lado */}
      <group position={[1.75, 0, 0.5]} rotation={[0, -0.7, 0]}>
        <Cuerpo colores={profe} brazoDer={brazo} />
      </group>

      {/* Los alumnos, sentados mirando la pizarra */}
      {alumnos.map((a, i) => (
        <group key={i} position={a.pos} rotation={[0, Math.PI, 0]}>
          <Lector position={[0, 0, 0]} giro={0} fase={a.fase} colores={a.colores} colorLibro={a.libro} />
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */

interface CampusPeopleProps {
  quality: QualityLevel
}

/**
 * La gente del campus: estudiantes caminando por el sendero, grupos leyendo
 * en el zacate, corrillos conversando y una clase de ingles al aire libre.
 *
 * Cada persona son ocho piezas de geometria compartida, asi que veinte
 * estudiantes no pesan mas que un par de edificios.
 */
export function CampusPeople({ quality }: CampusPeopleProps) {
  // Estas son las personas "protagonistas": pose propia, ocho piezas cada una.
  // El grueso de la multitud lo pone `CampusCrowd`, que va instanciado y sale
  // casi gratis. Subir mucho estos numeros SI cuesta llamadas de dibujo.
  const nCaminantes = quality === 'high' ? 8 : quality === 'medium' ? 5 : 3
  const nLectores = quality === 'high' ? 7 : quality === 'medium' ? 4 : 3
  const nCorrillos = quality === 'high' ? 2 : quality === 'medium' ? 1 : 0
  const nTrotadores = quality === 'high' ? 2 : quality === 'medium' ? 1 : 0
  const nEnBancas = quality === 'high' ? 4 : quality === 'medium' ? 2 : 0
  const nClases = quality === 'high' ? 2 : quality === 'medium' ? 1 : 0

  const caminantes = useMemo(() => {
    const rng = makeRng(9001)
    return Array.from({ length: nCaminantes }, (_, i) => ({
      radio: RADIO_CAMINO + (i % 2 === 0 ? 0 : 1.35) + range(rng, -0.25, 0.25),
      velocidad: (i % 3 === 0 ? -1 : 1) * range(rng, 0.055, 0.1),
      fase: (i / nCaminantes) * Math.PI * 2 + range(rng, -0.3, 0.3),
      colores: coloresAlAzar(rng),
    }))
  }, [nCaminantes])

  const lectores = useMemo(() => {
    const rng = makeRng(5150)
    return Array.from({ length: nLectores }, () => {
      const a = range(rng, 0, Math.PI * 2)
      const r = range(rng, 15, 28)
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      return {
        pos: [x, 0, z] as [number, number, number],
        // Sentados mirando hacia el centro del campus.
        giro: Math.atan2(-x, -z),
        fase: rng() * 6,
        colores: coloresAlAzar(rng),
        libro: pick(rng, ROPA),
        manta: rng() > 0.5,
      }
    })
  }, [nLectores])

  const corrillos = useMemo(() => {
    const rng = makeRng(2718)
    return Array.from({ length: nCorrillos }, (_, k) => {
      const a = 0.7 + k * 2.4
      const r = 17 + k * 3
      const cx = Math.cos(a) * r
      const cz = Math.sin(a) * r
      return {
        centro: [cx, cz] as [number, number],
        gente: [0, 1, 2].map((i) => ({
          pos: [cx + Math.cos((i / 3) * Math.PI * 2) * 0.85, 0, cz + Math.sin((i / 3) * Math.PI * 2) * 0.85] as [number, number, number],
          giro: -(i / 3) * Math.PI * 2 + Math.PI / 2,
          fase: rng() * 6,
          colores: coloresAlAzar(rng),
        })),
      }
    })
  }, [nCorrillos])

  // Los que trotan van por fuera del sendero de las bancas, para no atropellar
  // a nadie ni cruzarse con los que caminan despacio.
  const trotadores = useMemo(() => {
    const rng = makeRng(6161)
    return Array.from({ length: nTrotadores }, (_, i) => ({
      radio: RADIO_CAMINO + 7.5 + i * 2.4,
      velocidad: (i % 2 === 0 ? 1 : -1) * range(rng, 0.16, 0.23),
      fase: rng() * Math.PI * 2,
      colores: coloresAlAzar(rng),
    }))
  }, [nTrotadores])

  // Sentados en las bancas. Se usan indices que existen en las tres calidades
  // (ver como CampusProps saltea la lista): si no, en calidad baja quedarian
  // sentados en el aire.
  const enBancas = useMemo(() => {
    const rng = makeRng(3141)
    const indices = [0, 3, 5, 1, 6]
    return Array.from({ length: nEnBancas }, (_, i) => ({
      banca: BANCAS[indices[i % indices.length]],
      fase: rng() * 6,
      colores: coloresAlAzar(rng),
      leyendo: rng() > 0.45,
      libro: pick(rng, ROPA),
    }))
  }, [nEnBancas])

  return (
    <group>
      {caminantes.map((c, i) => (
        <Caminante key={`cam-${i}`} radio={c.radio} velocidad={c.velocidad} fase={c.fase} colores={c.colores} />
      ))}

      {trotadores.map((c, i) => (
        <Caminante key={`trote-${i}`} radio={c.radio} velocidad={c.velocidad} fase={c.fase} colores={c.colores} trote />
      ))}

      {enBancas.map((b, i) => (
        <EnBanca key={`banca-${i}`} banca={b.banca} fase={b.fase} colores={b.colores} leyendo={b.leyendo} colorLibro={b.libro} />
      ))}

      {lectores.map((l, i) => (
        <group key={`lec-${i}`}>
          {l.manta && (
            <mesh
              geometry={GEO.manta}
              material={mat(i % 2 === 0 ? '#f26b65' : '#8b93f8', 0.95)}
              position={[l.pos[0], 0.03, l.pos[2]]}
              receiveShadow
            />
          )}
          <Lector position={l.pos} giro={l.giro} fase={l.fase} colores={l.colores} colorLibro={l.libro} />
        </group>
      ))}

      {corrillos.map((c, k) =>
        c.gente.map((p, i) => (
          <Conversando key={`conv-${k}-${i}`} position={p.pos} giro={p.giro} fase={p.fase} colores={p.colores} />
        ))
      )}

      {nClases >= 1 && (
        <ClaseAlAireLibre
          position={[-21, 0, 7]}
          giro={0.55}
          semilla={4321}
          tema="Present Perfect"
          ejemplo="I have studied English"
        />
      )}
      {/* La segunda clase va al otro costado, fuera del pasillo de la camara. */}
      {nClases >= 2 && (
        <ClaseAlAireLibre
          position={[22, 0, 9]}
          giro={-0.8}
          semilla={9753}
          tema="Past Simple"
          ejemplo="She studied in Heredia"
          nAlumnos={5}
        />
      )}
    </group>
  )
}
