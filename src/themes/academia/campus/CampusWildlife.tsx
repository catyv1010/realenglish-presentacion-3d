import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'
import { makeRng, pick, range } from './rng'

/* Geometrias compartidas por toda la fauna. */

/** Un ala: triangulo largo y PLANO. Un cono normal se ve como un ladrillo. */
function alaGeometry() {
  const g = new THREE.ConeGeometry(0.15, 1, 3)
  g.scale(1, 1, 0.12)
  g.rotateZ(Math.PI / 2)
  g.translate(0.5, 0, 0)
  return g
}

const GEO = {
  ala: alaGeometry(),
  cuerpoAve: new THREE.SphereGeometry(0.14, 8, 6),
  alaMariposa: new THREE.CircleGeometry(0.16, 8),
  cuerpoConejo: new THREE.SphereGeometry(0.17, 10, 8),
  cabezaConejo: new THREE.SphereGeometry(0.12, 10, 8),
  oreja: new THREE.CapsuleGeometry(0.032, 0.16, 3, 6),
  cola: new THREE.SphereGeometry(0.07, 8, 6),
  rama: new THREE.CylinderGeometry(0.11, 0.16, 3.4, 6),
  tronco: new THREE.CylinderGeometry(0.42, 0.62, 7, 8),
  copa: new THREE.IcosahedronGeometry(1, 1),
  pico: new THREE.ConeGeometry(0.11, 0.5, 7),
  garra: new THREE.CylinderGeometry(0.03, 0.03, 0.18, 5),
}

const matCache = new Map<string, THREE.MeshStandardMaterial>()
function mat(color: string, opts: { roughness?: number; emissive?: string; emissiveIntensity?: number; side?: THREE.Side } = {}) {
  const key = `${color}|${opts.roughness ?? 0.8}|${opts.emissive ?? ''}|${opts.emissiveIntensity ?? 0}|${opts.side ?? 0}`
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? 0.8,
      metalness: 0,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.emissiveIntensity ?? 0,
      side: opts.side ?? THREE.FrontSide,
    })
    matCache.set(key, m)
  }
  return m
}

/* ------------------------------------------------------------------ */
/* Bandada de aves dando vueltas sobre el campus                        */
/* ------------------------------------------------------------------ */
function Bandada({ radio, altura, velocidad, fase, n, color }: { radio: number; altura: number; velocidad: number; fase: number; n: number; color: string }) {
  const grupo = useRef<THREE.Group>(null)
  const alas = useRef<THREE.Group[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (grupo.current) {
      grupo.current.rotation.y = fase + t * velocidad
      grupo.current.position.y = altura + Math.sin(t * 0.4 + fase) * 1.6
    }
    // Aletean desfasadas: una bandada perfecta se ve mecanica.
    for (let i = 0; i < alas.current.length; i++) {
      const g = alas.current[i]
      if (!g) continue
      const flap = Math.sin(t * 6.5 + i * 0.9)
      g.children[0].rotation.x = -0.15 - flap * 0.6
      g.children[1].rotation.x = 0.15 + flap * 0.6
    }
  })

  const aves = useMemo(() => {
    const rng = makeRng(Math.round(radio * 100 + n))
    return Array.from({ length: n }, (_, i) => ({
      pos: [radio + range(rng, -2.5, 2.5), range(rng, -1.2, 1.2), range(rng, -3, 3)] as [number, number, number],
      escala: range(rng, 0.34, 0.58),
      key: i,
    }))
  }, [radio, n])

  return (
    <group ref={grupo}>
      {aves.map((a, i) => (
        <group key={a.key} position={a.pos} scale={a.escala} rotation={[0, Math.PI / 2, 0]}>
          <mesh geometry={GEO.cuerpoAve} material={mat(color, { roughness: 0.7 })} scale={[1.7, 0.7, 0.55]} />
          <group
            ref={(el) => {
              if (el) alas.current[i] = el
            }}
          >
            {/* Cada ala vive en su propio grupo: el grupo es la articulacion
                del hombro y es lo unico que se gira al aletear. */}
            <group>
              <mesh geometry={GEO.ala} material={mat(color, { roughness: 0.8, side: THREE.DoubleSide })} rotation={[0, -Math.PI / 2, 0]} />
            </group>
            <group>
              <mesh geometry={GEO.ala} material={mat(color, { roughness: 0.8, side: THREE.DoubleSide })} rotation={[0, Math.PI / 2, 0]} />
            </group>
          </group>
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Mariposas morfo azul: vuelan en ocho, cerca de las flores            */
/* ------------------------------------------------------------------ */
function Mariposa({ centro, radio, altura, velocidad, fase, color }: { centro: [number, number]; radio: number; altura: number; velocidad: number; fase: number; color: string }) {
  const grupo = useRef<THREE.Group>(null)
  const alaIzq = useRef<THREE.Mesh>(null)
  const alaDer = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime * velocidad + fase
    if (grupo.current) {
      // Trayectoria en ocho (lemniscata): mucho mas viva que un circulo.
      const d = 1 + Math.sin(t) * Math.sin(t)
      grupo.current.position.set(
        centro[0] + (radio * Math.cos(t)) / d,
        altura + Math.sin(t * 2.3) * 0.45,
        centro[1] + (radio * Math.sin(t) * Math.cos(t)) / d
      )
      grupo.current.rotation.y = -t
    }
    const flap = Math.sin(state.clock.elapsedTime * 13 + fase)
    if (alaIzq.current) alaIzq.current.rotation.y = 0.6 + flap * 0.9
    if (alaDer.current) alaDer.current.rotation.y = -0.6 - flap * 0.9
  })

  return (
    <group ref={grupo}>
      <mesh ref={alaIzq} geometry={GEO.alaMariposa} material={mat(color, { roughness: 0.35, emissive: color, emissiveIntensity: 0.35, side: THREE.DoubleSide })} />
      <mesh ref={alaDer} geometry={GEO.alaMariposa} material={mat(color, { roughness: 0.35, emissive: color, emissiveIntensity: 0.35, side: THREE.DoubleSide })} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Conejitos saltando en el zacate                                      */
/* ------------------------------------------------------------------ */
function Conejo({ centro, radio, velocidad, fase }: { centro: [number, number]; radio: number; velocidad: number; fase: number }) {
  const grupo = useRef<THREE.Group>(null)
  const cuerpo = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime * velocidad + fase
    if (grupo.current) {
      grupo.current.position.set(centro[0] + Math.cos(t) * radio, 0, centro[1] + Math.sin(t * 0.8) * radio)
      grupo.current.rotation.y = -t
    }
    // Salta: brinquitos cortos con pausa, no un rebote constante.
    const brinco = Math.max(0, Math.sin(state.clock.elapsedTime * 3.4 + fase))
    if (cuerpo.current) {
      cuerpo.current.position.y = 0.17 + brinco * 0.22
      cuerpo.current.rotation.x = -brinco * 0.3
    }
  })

  return (
    <group ref={grupo}>
      <group ref={cuerpo}>
        <mesh geometry={GEO.cuerpoConejo} material={mat('#e8e2d8', { roughness: 0.95 })} scale={[1, 0.85, 1.35]} castShadow />
        <mesh geometry={GEO.cabezaConejo} material={mat('#efe9df', { roughness: 0.95 })} position={[0, 0.1, 0.2]} />
        <mesh geometry={GEO.oreja} material={mat('#efe9df', { roughness: 0.95 })} position={[-0.06, 0.26, 0.18]} rotation={[0.2, 0, -0.18]} />
        <mesh geometry={GEO.oreja} material={mat('#efe9df', { roughness: 0.95 })} position={[0.06, 0.26, 0.18]} rotation={[0.2, 0, 0.18]} />
        <mesh geometry={GEO.cola} material={mat('#ffffff', { roughness: 1 })} position={[0, 0.02, -0.24]} />
      </group>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Mono carablanca: uno sentado en la rama y otro colgando de la cola   */
/* ------------------------------------------------------------------ */
function MonoSentado({ position }: { position: [number, number, number] }) {
  const cabeza = useRef<THREE.Group>(null)
  const cola = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (cabeza.current) cabeza.current.rotation.y = Math.sin(t * 0.9) * 0.6
    if (cola.current) cola.current.rotation.x = -0.9 + Math.sin(t * 1.4) * 0.3
  })

  const oscuro = mat('#4a3728', { roughness: 0.95 })
  const claro = mat('#e8dcc4', { roughness: 0.9 })

  return (
    <group position={position}>
      <mesh geometry={GEO.cuerpoConejo} material={oscuro} scale={[0.85, 1.05, 0.8]} castShadow />
      <mesh geometry={GEO.cuerpoConejo} material={claro} position={[0, 0.02, 0.1]} scale={[0.6, 0.75, 0.5]} />
      <group ref={cabeza} position={[0, 0.24, 0.02]}>
        <mesh geometry={GEO.cabezaConejo} material={oscuro} scale={1.1} />
        <mesh geometry={GEO.cabezaConejo} material={claro} position={[0, -0.01, 0.07]} scale={[0.85, 0.85, 0.7]} />
        <mesh geometry={GEO.cola} material={oscuro} position={[-0.12, 0.02, 0]} scale={0.55} />
        <mesh geometry={GEO.cola} material={oscuro} position={[0.12, 0.02, 0]} scale={0.55} />
      </group>
      {/* La cola, larga y enroscada: es lo que lo hace mono y no oso */}
      <group ref={cola} position={[0, -0.05, -0.14]}>
        <mesh geometry={GEO.garra} material={oscuro} position={[0, -0.18, -0.02]} scale={[1.3, 2.6, 1.3]} />
        <mesh geometry={GEO.garra} material={oscuro} position={[0.06, -0.42, 0.05]} rotation={[0.8, 0, 0.4]} scale={[1.2, 2, 1.2]} />
      </group>
      {/* Bracitos agarrados a la rama */}
      <mesh geometry={GEO.garra} material={oscuro} position={[-0.14, -0.02, 0.06]} rotation={[0, 0, 0.5]} scale={[1, 1.8, 1]} />
      <mesh geometry={GEO.garra} material={oscuro} position={[0.14, -0.02, 0.06]} rotation={[0, 0, -0.5]} scale={[1, 1.8, 1]} />
    </group>
  )
}

function MonoColgando({ position }: { position: [number, number, number] }) {
  const grupo = useRef<THREE.Group>(null)

  useFrame((state) => {
    // Se hamaquea despacio, colgado de un brazo.
    if (grupo.current) grupo.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.85) * 0.32
  })

  const oscuro = mat('#4a3728', { roughness: 0.95 })
  const claro = mat('#e8dcc4', { roughness: 0.9 })

  return (
    <group ref={grupo} position={position}>
      <mesh geometry={GEO.garra} material={oscuro} position={[0, -0.16, 0]} scale={[1.2, 2.4, 1.2]} />
      <mesh geometry={GEO.cuerpoConejo} material={oscuro} position={[0, -0.5, 0]} scale={[0.72, 0.95, 0.7]} castShadow />
      <mesh geometry={GEO.cuerpoConejo} material={claro} position={[0, -0.5, 0.08]} scale={[0.5, 0.65, 0.45]} />
      <mesh geometry={GEO.cabezaConejo} material={oscuro} position={[0, -0.78, 0.02]} scale={1} />
      <mesh geometry={GEO.cabezaConejo} material={claro} position={[0, -0.79, 0.08]} scale={[0.8, 0.8, 0.65]} />
      {/* Piernas recogidas */}
      <mesh geometry={GEO.garra} material={oscuro} position={[-0.1, -0.72, 0.06]} rotation={[0.9, 0, 0.4]} scale={[1.1, 1.8, 1.1]} />
      <mesh geometry={GEO.garra} material={oscuro} position={[0.1, -0.72, 0.06]} rotation={[0.9, 0, -0.4]} scale={[1.1, 1.8, 1.1]} />
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Arbol protagonista con tucan, perezoso y monos                       */
/* ------------------------------------------------------------------ */
function ArbolConVida({
  position,
  giro,
  conTucan,
  conPerezoso,
  conMonos = false,
}: {
  position: [number, number, number]
  giro: number
  conTucan: boolean
  conPerezoso: boolean
  conMonos?: boolean
}) {
  const tucan = useRef<THREE.Group>(null)
  const perezoso = useRef<THREE.Group>(null)
  const cabezaTucan = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // El tucan da saltitos y mira alrededor.
    if (tucan.current) tucan.current.position.y = 3.62 + Math.abs(Math.sin(t * 1.6)) * 0.06
    if (cabezaTucan.current) cabezaTucan.current.rotation.y = Math.sin(t * 0.6) * 0.75
    // El perezoso se balancea. Muy despacio, que para eso es perezoso.
    if (perezoso.current) perezoso.current.rotation.z = Math.sin(t * 0.32) * 0.12
  })

  return (
    <group position={position} rotation={[0, giro, 0]}>
      <mesh geometry={GEO.tronco} material={mat('#6b4a34', { roughness: 0.95 })} position={[0, 3.5, 0]} castShadow />

      {/* Copa en tres masas */}
      <mesh geometry={GEO.copa} material={mat('#4f9d52', { roughness: 0.85 })} position={[0, 8.1, 0]} scale={[3.4, 2.6, 3.4]} castShadow />
      <mesh geometry={GEO.copa} material={mat('#62b262', { roughness: 0.85 })} position={[-2.1, 7.1, 0.8]} scale={[2.1, 1.7, 2.1]} castShadow />
      <mesh geometry={GEO.copa} material={mat('#3f8a45', { roughness: 0.85 })} position={[2.2, 7.3, -0.6]} scale={[2.2, 1.8, 2.2]} castShadow />

      {/* La rama donde se para el tucan y cuelga el perezoso */}
      <mesh geometry={GEO.rama} material={mat('#5c3f2d', { roughness: 0.95 })} position={[1.5, 3.6, 0.7]} rotation={[0, 0, -Math.PI / 2.3]} castShadow />

      {/* Segunda rama, al otro lado, para los monos */}
      {conMonos && (
        <mesh geometry={GEO.rama} material={mat('#5c3f2d', { roughness: 0.95 })} position={[-1.6, 4.6, -0.5]} rotation={[0, 0.5, Math.PI / 2.2]} castShadow />
      )}

      {conMonos && (
        <>
          <MonoSentado position={[-2.4, 4.95, -0.85]} />
          <MonoColgando position={[-3.3, 4.35, -0.95]} />
        </>
      )}

      {conTucan && (
        <group ref={tucan} position={[2.6, 3.62, 0.7]} rotation={[0, -0.5, 0]}>
          <mesh geometry={GEO.garra} material={mat('#4b5563', { roughness: 0.7 })} position={[0, -0.12, 0]} />
          <mesh geometry={GEO.cuerpoAve} material={mat('#161616', { roughness: 0.6 })} scale={[1.3, 1.6, 1.3]} position={[0, 0.14, 0]} castShadow />
          <mesh geometry={GEO.cuerpoAve} material={mat('#ffe08a', { roughness: 0.6 })} scale={[0.95, 1.1, 0.7]} position={[0, 0.2, 0.09]} />
          <group ref={cabezaTucan} position={[0, 0.36, 0]}>
            <mesh geometry={GEO.cuerpoAve} material={mat('#161616', { roughness: 0.6 })} scale={[0.85, 0.85, 0.85]} />
            <mesh geometry={GEO.pico} material={mat('#FF7700', { roughness: 0.45, emissive: '#FF7700', emissiveIntensity: 0.15 })} position={[0, 0.01, 0.28]} rotation={[Math.PI / 2, 0, 0]} />
          </group>
        </group>
      )}

      {conPerezoso && (
        <group ref={perezoso} position={[0.55, 3.5, 0.7]}>
          {/* Los brazos agarrados a la rama */}
          <mesh geometry={GEO.garra} material={mat('#8a7a63', { roughness: 0.95 })} position={[-0.16, -0.06, 0]} rotation={[0, 0, 0.5]} scale={[1, 1.6, 1]} />
          <mesh geometry={GEO.garra} material={mat('#8a7a63', { roughness: 0.95 })} position={[0.16, -0.06, 0]} rotation={[0, 0, -0.5]} scale={[1, 1.6, 1]} />
          <mesh geometry={GEO.cuerpoConejo} material={mat('#a89478', { roughness: 1 })} position={[0, -0.36, 0]} scale={[1.15, 1.5, 1.1]} castShadow />
          <mesh geometry={GEO.cabezaConejo} material={mat('#c7b79a', { roughness: 1 })} position={[0, -0.62, 0.03]} scale={[1.15, 1.05, 1.05]} />
        </group>
      )}
    </group>
  )
}

/* ------------------------------------------------------------------ */

interface CampusWildlifeProps {
  quality: QualityLevel
}

/**
 * La fauna del campus: bandadas dando vueltas en el cielo, mariposas morfo
 * azules sobre las flores, conejitos saltando en el zacate y dos arboles
 * protagonistas, uno con tucan y otro con perezoso.
 */
export function CampusWildlife({ quality }: CampusWildlifeProps) {
  const nMariposas = quality === 'high' ? 10 : quality === 'medium' ? 6 : 3
  const nConejos = quality === 'high' ? 5 : quality === 'medium' ? 3 : 1
  const bandadas = quality === 'high' ? 3 : quality === 'medium' ? 2 : 1

  const mariposas = useMemo(() => {
    const rng = makeRng(6060)
    const colores = ['#4f6cf7', '#5b8cff', '#7c5cff', '#f26b65', '#ffd166']
    return Array.from({ length: nMariposas }, () => {
      const a = range(rng, 0, Math.PI * 2)
      const r = range(rng, 15, 30)
      return {
        centro: [Math.cos(a) * r, Math.sin(a) * r] as [number, number],
        radio: range(rng, 1.6, 3.4),
        altura: range(rng, 0.9, 2.4),
        velocidad: range(rng, 0.35, 0.7),
        fase: rng() * 6,
        color: pick(rng, colores),
      }
    })
  }, [nMariposas])

  const conejos = useMemo(() => {
    const rng = makeRng(1212)
    return Array.from({ length: nConejos }, () => {
      const a = range(rng, 0, Math.PI * 2)
      const r = range(rng, 16, 26)
      return {
        centro: [Math.cos(a) * r, Math.sin(a) * r] as [number, number],
        radio: range(rng, 1.2, 2.6),
        velocidad: range(rng, 0.18, 0.34),
        fase: rng() * 6,
      }
    })
  }, [nConejos])

  return (
    <group>
      {bandadas >= 1 && <Bandada radio={32} altura={17} velocidad={0.09} fase={0} n={6} color="#6b7a9e" />}
      {bandadas >= 2 && <Bandada radio={24} altura={22} velocidad={-0.07} fase={2.1} n={5} color="#7c8bab" />}
      {bandadas >= 3 && <Bandada radio={40} altura={14} velocidad={0.05} fase={4.2} n={7} color="#5b6b8f" />}

      {mariposas.map((m, i) => (
        <Mariposa key={`mar-${i}`} {...m} />
      ))}

      {conejos.map((c, i) => (
        <Conejo key={`con-${i}`} {...c} />
      ))}

      {/* El arbol de los animales va pegado al borde derecho de la plaza: es
          la unica franja donde ni el panel de texto de la izquierda ni el
          bosque del fondo lo pueden tapar. Lleva el tucan Y el perezoso. */}
      <ArbolConVida position={[14, 0, -8]} giro={-0.75} conTucan conPerezoso conMonos />
      {/* Otro al fondo, para que el de la derecha no parezca puesto a mano. */}
      <ArbolConVida position={[-20, 0, -16]} giro={2.2} conTucan conPerezoso={false} conMonos />
    </group>
  )
}
