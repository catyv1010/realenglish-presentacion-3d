import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'

/**
 * La fauna de tierra y de flor del campus: ardillas, colibries, un perro que
 * corre, un gato dormido, una iguana en su piedra y una ranita roja.
 *
 * Todos comparten geometrias y materiales, asi que ocho animales pesan menos
 * que un edificio. Cada uno tiene su propio ritmo: la ardilla va a tirones,
 * el colibri se queda clavado en el aire, el gato solo respira. Que se muevan
 * a distinta velocidad es lo que hace que el campus parezca vivo y no un
 * carrusel.
 *
 * SOBRE EL TAMAÑO: los animales NO van a escala real. Una ardilla de veinte
 * centimetros, vista desde donde esta la camara, mide tres pixeles: existe
 * pero nadie la ve. Van agrandados entre dos y cuatro veces, como en las
 * maquetas y los dibujos animados, y colocados en la franja de adelante del
 * campus, que es la que la camara siempre tiene cerca.
 */

const GEO = {
  esfera: new THREE.SphereGeometry(1, 10, 8),
  capsula: new THREE.CapsuleGeometry(1, 1, 4, 8),
  cono: new THREE.ConeGeometry(1, 1, 6),
  circulo: new THREE.CircleGeometry(1, 8),
  cilindro: new THREE.CylinderGeometry(1, 1, 1, 6),
  piedra: new THREE.DodecahedronGeometry(1, 0),
}

const matCache = new Map<string, THREE.MeshStandardMaterial>()
function mat(color: string, opts: { rough?: number; emissive?: string; ei?: number; transparent?: boolean; opacity?: number } = {}) {
  const key = `${color}|${opts.rough ?? 0.85}|${opts.emissive ?? ''}|${opts.ei ?? 0}|${opts.opacity ?? 1}`
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.rough ?? 0.85,
      metalness: 0,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.ei ?? 0,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
      side: THREE.DoubleSide,
      flatShading: true,
    })
    matCache.set(key, m)
  }
  return m
}

/* ------------------------------------------------------------------ */
/* Ardilla: corre a tirones y se queda quieta oliendo el aire           */
/* ------------------------------------------------------------------ */
function Ardilla({ centro, radio, fase, escala = 2 }: { centro: [number, number]; radio: number; fase: number; escala?: number }) {
  const grupo = useRef<THREE.Group>(null)
  const cuerpo = useRef<THREE.Group>(null)
  const cola = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime + fase
    // Avanza en tirones: corre un rato, se para, vuelve a correr.
    const ciclo = (t * 0.28) % 1
    const avance = ciclo < 0.55 ? ciclo / 0.55 : 1
    const vuelta = Math.floor(t * 0.28)
    const a = vuelta * 1.7 + avance * 1.7
    if (grupo.current) {
      grupo.current.position.set(centro[0] + Math.cos(a) * radio, 0, centro[1] + Math.sin(a) * radio)
      grupo.current.rotation.y = -a + Math.PI / 2
    }
    const corriendo = ciclo < 0.55
    if (cuerpo.current) {
      cuerpo.current.position.y = 0.14 + (corriendo ? Math.abs(Math.sin(t * 14)) * 0.09 : 0)
      // Cuando se para, se sienta y levanta el pecho.
      cuerpo.current.rotation.x = corriendo ? 0.12 : -0.4
    }
    if (cola.current) cola.current.rotation.x = -0.7 + Math.sin(t * (corriendo ? 12 : 2.4)) * 0.25
  })

  return (
    <group ref={grupo} scale={escala}>
      <group ref={cuerpo}>
        <mesh geometry={GEO.esfera} material={mat('#9a5f34', { rough: 0.95 })} scale={[0.11, 0.1, 0.17]} castShadow />
        <mesh geometry={GEO.esfera} material={mat('#a86b3d', { rough: 0.95 })} position={[0, 0.09, 0.14]} scale={0.08} />
        <mesh geometry={GEO.cono} material={mat('#a86b3d', { rough: 0.95 })} position={[0, 0.09, 0.21]} rotation={[Math.PI / 2, 0, 0]} scale={[0.035, 0.07, 0.035]} />
        <mesh geometry={GEO.esfera} material={mat('#8a5730', { rough: 0.95 })} position={[-0.04, 0.15, 0.12]} scale={0.03} />
        <mesh geometry={GEO.esfera} material={mat('#8a5730', { rough: 0.95 })} position={[0.04, 0.15, 0.12]} scale={0.03} />
        <group ref={cola} position={[0, 0.06, -0.15]}>
          <mesh geometry={GEO.esfera} material={mat('#b87844', { rough: 1 })} position={[0, 0.12, -0.08]} scale={[0.07, 0.19, 0.09]} />
        </group>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Colibri: se queda clavado en el aire y salta de flor en flor         */
/* ------------------------------------------------------------------ */
function Colibri({ base, fase, color, escala = 4 }: { base: [number, number, number]; fase: number; color: string; escala?: number }) {
  const grupo = useRef<THREE.Group>(null)
  const alaIzq = useRef<THREE.Mesh>(null)
  const alaDer = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime + fase
    if (grupo.current) {
      // Tres flores, y va rotando entre ellas quedandose quieto en cada una.
      const parada = Math.floor(t * 0.22) % 3
      const objetivo = [
        [base[0], base[1], base[2]],
        [base[0] + 1.9, base[1] + 0.4, base[2] - 1.3],
        [base[0] - 1.5, base[1] - 0.2, base[2] + 1.6],
      ][parada]
      grupo.current.position.x += (objetivo[0] - grupo.current.position.x) * 0.08
      grupo.current.position.y += (objetivo[1] + Math.sin(t * 5) * 0.05 - grupo.current.position.y) * 0.14
      grupo.current.position.z += (objetivo[2] - grupo.current.position.z) * 0.08
      grupo.current.rotation.y = Math.sin(t * 0.9) * 0.7
    }
    // Las alas van tan rapido que solo se ven como un borron: por eso van
    // semitransparentes y a mas de veinte ciclos por segundo.
    const flap = Math.sin(t * 42)
    if (alaIzq.current) alaIzq.current.rotation.z = 0.4 + flap * 0.9
    if (alaDer.current) alaDer.current.rotation.z = -0.4 - flap * 0.9
  })

  return (
    <group ref={grupo} position={base} scale={escala}>
      <mesh geometry={GEO.capsula} material={mat(color, { rough: 0.45, emissive: color, ei: 0.25 })} scale={[0.05, 0.05, 0.05]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={GEO.esfera} material={mat('#2b2b2b', { rough: 0.6 })} position={[0, 0.04, 0.07]} scale={0.035} />
      <mesh geometry={GEO.cono} material={mat('#3b3b3b', { rough: 0.5 })} position={[0, 0.04, 0.15]} rotation={[Math.PI / 2, 0, 0]} scale={[0.012, 0.12, 0.012]} />
      <mesh ref={alaIzq} geometry={GEO.circulo} material={mat('#e6f0ff', { rough: 0.2, transparent: true, opacity: 0.45 })} position={[0.05, 0.03, 0]} scale={[0.13, 0.05, 1]} />
      <mesh ref={alaDer} geometry={GEO.circulo} material={mat('#e6f0ff', { rough: 0.2, transparent: true, opacity: 0.45 })} position={[-0.05, 0.03, 0]} scale={[0.13, 0.05, 1]} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Perro: corre por el zacate con la cola dando vueltas                 */
/* ------------------------------------------------------------------ */
function Perro({ radio, velocidad, escala = 1.3 }: { radio: number; velocidad: number; escala?: number }) {
  const grupo = useRef<THREE.Group>(null)
  const cuerpo = useRef<THREE.Group>(null)
  const cola = useRef<THREE.Group>(null)
  const patas = useRef<THREE.Group[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const a = t * velocidad
    if (grupo.current) {
      grupo.current.position.set(Math.cos(a) * radio, 0, Math.sin(a) * radio * 0.8)
      // Con velocidad negativa el perro recorre la elipse al reves: si no se
      // le da la vuelta tambien al hocico, corre de espaldas.
      grupo.current.rotation.y = -a + (velocidad > 0 ? Math.PI / 2 : -Math.PI / 2)
    }
    if (cuerpo.current) cuerpo.current.position.y = 0.3 + Math.abs(Math.sin(t * 9)) * 0.05
    if (cola.current) cola.current.rotation.y = Math.sin(t * 11) * 0.55
    for (let i = 0; i < patas.current.length; i++) {
      const p = patas.current[i]
      if (p) p.rotation.x = Math.sin(t * 9 + (i % 2) * Math.PI) * 0.8
    }
  })

  const cuero = mat('#c98b4b', { rough: 0.95 })
  const cueroOscuro = mat('#a86f38', { rough: 0.95 })

  return (
    <group ref={grupo} scale={escala}>
      <group ref={cuerpo}>
        <mesh geometry={GEO.capsula} material={cuero} scale={[0.15, 0.16, 0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        <mesh geometry={GEO.esfera} material={cuero} position={[0, 0.14, 0.32]} scale={0.14} />
        <mesh geometry={GEO.capsula} material={cuero} position={[0, 0.1, 0.44]} scale={[0.06, 0.05, 0.06]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={GEO.esfera} material={mat('#2b2b2b', { rough: 0.5 })} position={[0, 0.11, 0.52]} scale={0.035} />
        <mesh geometry={GEO.cono} material={cueroOscuro} position={[-0.1, 0.24, 0.3]} rotation={[0.3, 0, -0.4]} scale={[0.06, 0.12, 0.03]} />
        <mesh geometry={GEO.cono} material={cueroOscuro} position={[0.1, 0.24, 0.3]} rotation={[0.3, 0, 0.4]} scale={[0.06, 0.12, 0.03]} />
        <group ref={cola} position={[0, 0.14, -0.3]}>
          <mesh geometry={GEO.capsula} material={cueroOscuro} position={[0, 0.1, -0.06]} scale={[0.032, 0.09, 0.032]} rotation={[-0.7, 0, 0]} />
        </group>
        {[
          [-0.1, -0.24],
          [0.1, -0.24],
          [-0.1, 0.2],
          [0.1, 0.2],
        ].map(([x, z], i) => (
          <group
            key={`pata-${i}`}
            position={[x, 0, z]}
            ref={(el) => {
              if (el) patas.current[i] = el
            }}
          >
            <mesh geometry={GEO.cilindro} material={cueroOscuro} position={[0, -0.14, 0]} scale={[0.035, 0.28, 0.035]} />
          </group>
        ))}
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Gato dormido: solo respira                                           */
/* ------------------------------------------------------------------ */
function Gato({ position, giro, escala = 1.4 }: { position: [number, number, number]; giro: number; escala?: number }) {
  const cuerpo = useRef<THREE.Mesh>(null)
  const oreja = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (cuerpo.current) {
      const respira = 1 + Math.sin(t * 1.5) * 0.035
      cuerpo.current.scale.set(0.26 * respira, 0.17 * respira, 0.3 * respira)
    }
    // Cada tanto mueve una oreja, como los gatos dormidos.
    if (oreja.current) {
      const tic = Math.sin(t * 0.6)
      oreja.current.rotation.z = tic > 0.95 ? (tic - 0.95) * 8 : 0
    }
  })

  const gris = mat('#7c7f8a', { rough: 1 })

  return (
    <group position={position} rotation={[0, giro, 0]} scale={escala}>
      <mesh ref={cuerpo} geometry={GEO.esfera} material={gris} position={[0, 0.16, 0]} scale={[0.26, 0.17, 0.3]} castShadow />
      <mesh geometry={GEO.esfera} material={gris} position={[0, 0.2, 0.24]} scale={0.13} />
      <group ref={oreja}>
        <mesh geometry={GEO.cono} material={gris} position={[-0.07, 0.31, 0.24]} scale={[0.05, 0.08, 0.02]} />
      </group>
      <mesh geometry={GEO.cono} material={gris} position={[0.07, 0.31, 0.24]} scale={[0.05, 0.08, 0.02]} />
      {/* La cola enroscada alrededor del cuerpo */}
      <mesh geometry={GEO.cilindro} material={gris} position={[0.2, 0.09, -0.14]} rotation={[0, 0, Math.PI / 2]} scale={[0.035, 0.42, 0.035]} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Iguana sobre su piedra, tomando sol                                  */
/* ------------------------------------------------------------------ */
function Iguana({ position, giro, escala = 1.6 }: { position: [number, number, number]; giro: number; escala?: number }) {
  const cabeza = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Quieta como una estatua y de pronto un movimiento seco de cabeza.
    if (cabeza.current) {
      const tic = Math.sin(t * 0.4)
      cabeza.current.rotation.y = tic > 0.9 ? (tic - 0.9) * 6 : 0
    }
  })

  const verde = mat('#6f9e4a', { rough: 0.9 })
  const verdeOsc = mat('#557c38', { rough: 0.9 })

  return (
    <group position={position} rotation={[0, giro, 0]} scale={escala}>
      <mesh geometry={GEO.piedra} material={mat('#b9b3a6', { rough: 1 })} scale={[0.9, 0.5, 0.8]} position={[0, 0.22, 0]} castShadow receiveShadow />
      <group position={[0, 0.6, 0]}>
        <mesh geometry={GEO.capsula} material={verde} scale={[0.1, 0.16, 0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow />
        <group ref={cabeza} position={[0, 0.02, 0.3]}>
          <mesh geometry={GEO.esfera} material={verde} scale={[0.09, 0.07, 0.12]} />
        </group>
        {/* Cola larga, que es lo que la delata como iguana */}
        <mesh geometry={GEO.cono} material={verdeOsc} position={[0, 0, -0.55]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.06, 0.6, 0.06]} />
        {/* Cresta */}
        {[-0.12, 0.02, 0.16].map((z, i) => (
          <mesh key={`cresta-${i}`} geometry={GEO.cono} material={verdeOsc} position={[0, 0.11, z]} scale={[0.02, 0.07, 0.05]} />
        ))}
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Ranita roja: el guiño tico, chiquitita sobre una hoja                */
/* ------------------------------------------------------------------ */
function RanitaRoja({ position, escala = 2.2 }: { position: [number, number, number]; escala?: number }) {
  const cuerpo = useRef<THREE.Mesh>(null)
  const grupo = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (cuerpo.current) cuerpo.current.scale.y = 0.075 * (1 + Math.sin(t * 2.6) * 0.09)
    // Un brinco cortito de vez en cuando.
    if (grupo.current) {
      const salto = Math.sin(t * 0.5)
      grupo.current.position.y = position[1] + (salto > 0.97 ? (salto - 0.97) * 9 : 0)
    }
  })

  return (
    <group ref={grupo} position={position} scale={escala}>
      <mesh geometry={GEO.circulo} material={mat('#3f8a45', { rough: 0.9 })} rotation={[-Math.PI / 2, 0, 0]} scale={0.28} />
      <mesh ref={cuerpo} geometry={GEO.esfera} material={mat('#4fbf5a', { rough: 0.6 })} position={[0, 0.07, 0]} scale={[0.1, 0.075, 0.12]} />
      <mesh geometry={GEO.esfera} material={mat('#e23b3b', { rough: 0.4, emissive: '#e23b3b', ei: 0.35 })} position={[-0.05, 0.14, 0.03]} scale={0.045} />
      <mesh geometry={GEO.esfera} material={mat('#e23b3b', { rough: 0.4, emissive: '#e23b3b', ei: 0.35 })} position={[0.05, 0.14, 0.03]} scale={0.045} />
      <mesh geometry={GEO.esfera} material={mat('#2f6fd0', { rough: 0.6 })} position={[-0.09, 0.03, 0.02]} scale={[0.035, 0.03, 0.05]} />
      <mesh geometry={GEO.esfera} material={mat('#2f6fd0', { rough: 0.6 })} position={[0.09, 0.03, 0.02]} scale={[0.035, 0.03, 0.05]} />
    </group>
  )
}

interface CampusFaunaProps {
  quality: QualityLevel
}

export function CampusFauna({ quality }: CampusFaunaProps) {
  const alto = quality === 'high'
  const medio = quality !== 'low'

  // La franja de adelante (Z entre 10 y 17, X entre -10 y 12) es la que la
  // camara siempre tiene mas cerca en las catorce escenas. Ahi es donde se
  // ponen los animales que se tienen que ver si o si.
  const ardillas = useMemo(
    () =>
      [
        { centro: [6, 11] as [number, number], radio: 1.8, fase: 0 },
        { centro: [-12, 9] as [number, number], radio: 2.2, fase: 2.4 },
        { centro: [16, -5] as [number, number], radio: 1.6, fase: 4.1 },
        { centro: [-17, 4] as [number, number], radio: 2.0, fase: 1.3 },
        { centro: [20, 8] as [number, number], radio: 1.7, fase: 5.2 },
        { centro: [-6, 16] as [number, number], radio: 2.4, fase: 3.3 },
        { centro: [12, 14] as [number, number], radio: 1.9, fase: 0.8 },
      ].slice(0, alto ? 7 : medio ? 3 : 1),
    [alto, medio]
  )

  const colibries = useMemo(
    () =>
      [
        { base: [9, 1.6, 10] as [number, number, number], fase: 0, color: '#2fb56f' },
        { base: [-8, 1.5, 11] as [number, number, number], fase: 2.2, color: '#c94fb5' },
        { base: [15, 1.6, -5] as [number, number, number], fase: 4.4, color: '#2f8fd0' },
        { base: [-15, 1.7, 8] as [number, number, number], fase: 1.1, color: '#e0703a' },
        { base: [19, 1.5, 3] as [number, number, number], fase: 3.6, color: '#7c5cff' },
        { base: [-19, 1.6, -4] as [number, number, number], fase: 5.1, color: '#2fb56f' },
      ].slice(0, alto ? 6 : medio ? 3 : 0),
    [alto, medio]
  )

  return (
    <group>
      {ardillas.map((a, i) => (
        <Ardilla key={`ard-${i}`} {...a} />
      ))}

      {colibries.map((c, i) => (
        <Colibri key={`col-${i}`} {...c} />
      ))}

      {/* El perro corre en una elipse que cruza justo por delante del campus */}
      {medio && <Perro radio={17} velocidad={0.16} />}
      {/* El segundo va al reves y por fuera, para que no parezcan un espejo */}
      {alto && <Perro radio={25} velocidad={-0.12} escala={1.15} />}

      {medio && <Gato position={[-6, 0, 12]} giro={-0.6} />}
      {alto && <Gato position={[17, 0, 12]} giro={1.9} escala={1.25} />}

      {alto && <Iguana position={[11, 0, 9]} giro={0.7} />}
      {alto && <Iguana position={[-18, 0, -2]} giro={-1.3} escala={1.4} />}

      {alto && <RanitaRoja position={[-11, 0.02, 10]} />}
      {alto && <RanitaRoja position={[13, 0.02, 16]} escala={2} />}
      {medio && <RanitaRoja position={[-16, 0.02, 14]} escala={1.9} />}
    </group>
  )
}
