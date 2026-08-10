import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'
import { BASE_DATOS } from './layout'

/**
 * El monumento a la base de datos: el corazon del proyecto, puesto en el
 * campus como un edificio mas.
 *
 * Toda la presentacion habla de quince tablas, de triggers y de matriculas,
 * pero el campus no tenia una sola pieza que dijera "esto es un sistema".
 * Aqui esta: la silueta clasica de tres discos apilados que cualquiera
 * reconoce como una base de datos, girando sobre su plaza, con los nombres de
 * las tablas en orbita y los datos subiendo desde el suelo.
 *
 * Vive al fondo a la derecha (ver BASE_DATOS en layout.ts), fuera del arco de
 * portales y fuera del pasillo de la camara: se ve en las catorce escenas sin
 * taparle nada al contenido.
 */

/* Las quince tablas reales del proyecto, en el orden en que se explican. */
const TABLAS = [
  'REGIONES',
  'SEDES',
  'NIVELES',
  'DEPARTAMENTOS',
  'PUESTOS',
  'AULAS',
  'CURSOS',
  'EMPLEADOS',
  'ESTUDIANTES',
  'GRUPOS',
  'MATRICULAS',
  'PAGOS',
  'ASISTENCIA',
  'EVALUACIONES',
  'BITACORA',
]

const AZUL = '#525fe1'
const AZUL_OSCURO = '#1a2d62'
const CORAL = '#f26b65'

const GEO = {
  disco: new THREE.CylinderGeometry(1, 1, 1, 40),
  aro: new THREE.TorusGeometry(1, 0.035, 8, 48),
  plaza: new THREE.CylinderGeometry(9, 9.4, 0.3, 40),
  pedestal: new THREE.CylinderGeometry(4.6, 5.2, 1.4, 28),
  escalon: new THREE.CylinderGeometry(6.4, 6.7, 0.28, 32),
  columna: new THREE.CylinderGeometry(0.26, 0.3, 6.2, 10),
  tarjeta: new THREE.PlaneGeometry(2.6, 0.76),
  chispa: new THREE.OctahedronGeometry(0.14, 0),
}

const MAT = {
  plaza: new THREE.MeshStandardMaterial({ color: '#dfe3fa', roughness: 0.92 }),
  pedestal: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75 }),
  columna: new THREE.MeshStandardMaterial({ color: '#f4f6ff', roughness: 0.7 }),
  // Los discos son de cristal azul: translucidos para que se les vea el
  // interior encendido y no parezcan tres tapas de olla.
  disco: new THREE.MeshStandardMaterial({
    color: AZUL,
    roughness: 0.22,
    metalness: 0.45,
    transparent: true,
    opacity: 0.86,
    emissive: AZUL,
    emissiveIntensity: 0.35,
  }),
  discoTapa: new THREE.MeshStandardMaterial({
    color: '#8b93f8',
    roughness: 0.18,
    metalness: 0.5,
    emissive: '#8b93f8',
    emissiveIntensity: 0.55,
  }),
  aro: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#cfd9f6',
    emissiveIntensity: 1.4,
    roughness: 0.3,
  }),
  aroCoral: new THREE.MeshStandardMaterial({
    color: CORAL,
    emissive: CORAL,
    emissiveIntensity: 1.1,
    roughness: 0.35,
  }),
  tarjeta: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.7, side: THREE.DoubleSide }),
  chispa: new THREE.MeshStandardMaterial({
    color: '#ffd166',
    emissive: '#ffd166',
    emissiveIntensity: 1.6,
    roughness: 0.4,
  }),
}

/** Los tres discos apilados, girando cada uno a su ritmo. */
function Pila() {
  const grupo = useRef<THREE.Group>(null)
  const discos = useRef<(THREE.Group | null)[]>([])
  const aros = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // El conjunto flota apenas: quieto del todo parecia una maqueta pegada.
    if (grupo.current) grupo.current.position.y = 1.4 + Math.sin(t * 0.5) * 0.12

    discos.current.forEach((d, i) => {
      // Cada disco gira en sentido contrario al de abajo. Es lo que hace que
      // se lea como un mecanismo y no como un pastel de bodas.
      if (d) d.rotation.y = t * (0.18 - i * 0.07) * (i % 2 === 0 ? 1 : -1)
    })
    aros.current.forEach((a, i) => {
      if (a) {
        a.rotation.z = t * (0.4 + i * 0.25)
        a.scale.setScalar(1 + Math.sin(t * 1.3 + i * 1.4) * 0.03)
      }
    })
  })

  const alturaDisco = 1.5
  const radios = [3.9, 3.55, 3.15]

  return (
    <group ref={grupo}>
      {radios.map((r, i) => {
        const y = i * (alturaDisco + 0.42)
        return (
          <group
            key={`disco-${i}`}
            ref={(el) => {
              discos.current[i] = el
            }}
            position={[0, y, 0]}
          >
            {/* El cuerpo del disco */}
            <mesh geometry={GEO.disco} material={MAT.disco} scale={[r, alturaDisco, r]} castShadow />
            {/* La tapa: es el brillo que dibuja la silueta de "base de datos" */}
            <mesh
              geometry={GEO.disco}
              material={MAT.discoTapa}
              scale={[r * 1.02, 0.16, r * 1.02]}
              position={[0, alturaDisco / 2, 0]}
            />
            {/* Franjas de datos girando dentro del cristal */}
            {[0, 1, 2, 3].map((k) => (
              <mesh
                key={`franja-${k}`}
                geometry={GEO.aro}
                material={k === 1 ? MAT.aroCoral : MAT.aro}
                rotation={[Math.PI / 2, 0, 0]}
                position={[0, -alturaDisco / 2 + 0.3 + k * 0.32, 0]}
                scale={[r * 1.015, r * 1.015, 1]}
              />
            ))}
          </group>
        )
      })}

      {/* Dos aros sueltos alrededor de la pila, inclinados como un atomo */}
      {[0, 1].map((i) => (
        <mesh
          key={`halo-${i}`}
          ref={(el) => {
            aros.current[i] = el
          }}
          geometry={GEO.aro}
          material={i === 0 ? MAT.aro : MAT.aroCoral}
          position={[0, alturaDisco * 1.6, 0]}
          rotation={[i === 0 ? 1.1 : 1.9, 0, 0]}
          scale={[5.6 + i * 0.7, 5.6 + i * 0.7, 1]}
        />
      ))}
    </group>
  )
}

/** Los nombres de las tablas dando vueltas alrededor del monumento. */
function TablasEnOrbita({ n }: { n: number }) {
  const grupo = useRef<THREE.Group>(null)

  const tarjetas = useMemo(() => {
    // Se reparten las quince tablas en las que caben, sin repetir.
    const paso = TABLAS.length / n
    return Array.from({ length: n }, (_, i) => ({
      nombre: TABLAS[Math.floor(i * paso) % TABLAS.length],
      angulo: (i / n) * Math.PI * 2,
      altura: 2.2 + (i % 3) * 1.5,
      // Orbita ajustada: mas ancha, las tarjetas de los lados se salian del
      // cuadro y el monumento se leia cortado.
      radio: 6 + (i % 2) * 0.7,
    }))
  }, [n])

  useFrame((state) => {
    if (grupo.current) grupo.current.rotation.y = state.clock.elapsedTime * 0.075
  })

  return (
    <group ref={grupo} position={[0, 1.6, 0]}>
      {tarjetas.map((c, i) => (
        <group key={`tabla-${i}`} position={[Math.cos(c.angulo) * c.radio, c.altura, Math.sin(c.angulo) * c.radio]}>
          {/* Billboard: la tarjeta siempre de frente a la camara, aunque el
              anillo entero este girando. Sin esto, la mitad se leen al reves. */}
          <Billboard>
            <mesh geometry={GEO.tarjeta} material={MAT.tarjeta} />
            <mesh geometry={GEO.tarjeta} material={i % 3 === 0 ? MAT.aroCoral : MAT.aro} scale={[1.04, 1.12, 1]} position={[0, 0, -0.02]} />
            <Text position={[0, 0, 0.03]} fontSize={0.36} color={AZUL_OSCURO} anchorX="center" anchorY="middle" fontWeight="bold">
              {c.nombre}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  )
}

/** Los datos subiendo desde la plaza hacia la pila. */
function FlujoDeDatos({ n }: { n: number }) {
  const puntos = useRef<THREE.Points>(null)

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 * 3
      const r = 2.2 + (i % 9) * 0.55
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = (i / n) * 9
      pos[i * 3 + 2] = Math.sin(a) * r
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [n])

  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#ffd166',
        size: 0.22,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  )

  useFrame((_state, delta) => {
    if (!puntos.current) return
    puntos.current.rotation.y += delta * 0.25
    const attr = puntos.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3 + 1] += delta * 1.8
      if (arr[i * 3 + 1] > 9.5) arr[i * 3 + 1] = 0
    }
    attr.needsUpdate = true
  })

  return <points ref={puntos} geometry={geo} material={mat} position={[0, 0.2, 0]} />
}

interface CampusDatabaseProps {
  quality: QualityLevel
}

/**
 * Altura del monte.
 *
 * A ras del suelo el monumento se lo comia el bosque: esta a treinta y cinco
 * metros de la camara y los arboles de en medio, aunque son mas bajos, estan
 * mucho mas cerca del lente y lo tapaban entero. Subido a un monte de cinco
 * metros, la pila de discos queda por encima de las copas y se ve desde las
 * catorce escenas.
 */
const ALTURA_MONTE = 5

export function CampusDatabase({ quality }: CampusDatabaseProps) {
  const [bx, bz] = BASE_DATOS
  const nTarjetas = quality === 'high' ? 10 : quality === 'medium' ? 6 : 0
  const nPuntos = quality === 'high' ? 200 : quality === 'medium' ? 110 : 45
  const conColumnas = quality !== 'low'

  return (
    <group position={[bx, 0, bz]}>
      {/* El monte sobre el que se levanta */}
      <mesh position={[0, ALTURA_MONTE / 2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[11, 14.5, ALTURA_MONTE, 18]} />
        <meshStandardMaterial color="#a9d998" roughness={1} metalness={0} flatShading />
      </mesh>

      <group position={[0, ALTURA_MONTE, 0]} rotation={[0, -0.5, 0]} scale={1.15}>
      {/* La plaza y las gradas */}
      <mesh geometry={GEO.plaza} material={MAT.plaza} position={[0, 0.1, 0]} receiveShadow />
      <mesh geometry={GEO.escalon} material={MAT.pedestal} position={[0, 0.36, 0]} receiveShadow />
      <mesh geometry={GEO.pedestal} material={MAT.pedestal} position={[0, 0.9, 0]} castShadow receiveShadow />

      {/* Cuatro obeliscos en los ejes: dan escala sin meterse en la orbita de
          las tarjetas, que es lo que hacia la columnata de antes. */}
      {conColumnas &&
        Array.from({ length: 4 }, (_, i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4
          return (
            <mesh
              key={`col-${i}`}
              geometry={GEO.columna}
              material={MAT.columna}
              position={[Math.cos(a) * 8.2, 3.4, Math.sin(a) * 8.2]}
              castShadow
            />
          )
        })}

      <Pila />
      <FlujoDeDatos n={nPuntos} />
      {nTarjetas > 0 && <TablasEnOrbita n={nTarjetas} />}

      {/* Una luz propia: de noche o con niebla, el monumento se sigue leyendo */}
      <pointLight position={[0, 5, 0]} intensity={quality === 'low' ? 8 : 22} distance={26} color="#9fb0ff" />

      {/* El rotulo */}
      <Billboard position={[0, 13.4, 0]}>
        <mesh>
          <planeGeometry args={[11.4, 1.9]} />
          <meshStandardMaterial color={AZUL_OSCURO} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[11.8, 2.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>
        <Text position={[0, 0.28, 0.02]} fontSize={0.82} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
          BASE DE DATOS
        </Text>
        <Text position={[0, -0.52, 0.02]} fontSize={0.42} color="#8b93f8" anchorX="center" anchorY="middle">
          15 tablas · 1 592 filas · Oracle
        </Text>
      </Billboard>
      </group>
    </group>
  )
}
