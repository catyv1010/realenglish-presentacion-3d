import { useRef, useLayoutEffect, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
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

/**
 * Prisma triangular con la base plana y el vertice arriba: el fronton del
 * portico.
 *
 * Un cilindro de tres lados ya es un prisma triangular, pero nace con el eje
 * en Y. Three.js reparte los vertices con `x = r·sin(t)` y `z = r·cos(t)`, o
 * sea que el primero apunta a +Z (no a +X, que es lo que uno supondria). Con
 * eso, un solo cuarto de vuelta sobre X basta: acuesta el prisma sobre Z y
 * deja el vertice arriba y la base horizontal. La rotacion se hornea en la
 * geometria y no en el mesh para que la escala del mesh siga siendo
 * ancho/alto/fondo y no haya que pensar en ejes rotados al usarlo.
 *
 * Medidas de la pieza sin escalar: vertice en y=1, base en y=-0.5, medio
 * ancho 0.866, fondo 1.
 */
const GEO_FRONTON = (() => {
  const g = new THREE.CylinderGeometry(1, 1, 1, 3)
  g.rotateX(-Math.PI / 2)
  return g
})()

const CREMA = '#f6f3ea'
const TECHO = '#1a2d62'

function Edificio({ w, h, d, color }: VariantProps) {
  const ancho = w * 1.9
  const fondo = d * 1.5
  const frente = fondo / 2

  const pisos = Math.max(2, Math.min(4, Math.round(h / 1.8)))
  const altoPiso = h / pisos
  const yBase = 0.34

  // El portico llega hasta la mitad del edificio: mas alto se come la fachada,
  // mas bajo parece un porche de casa.
  const altoColumna = Math.min(h * 0.52, altoPiso * 1.9)
  const anchoPortico = ancho * 0.56
  const fondoPortico = Math.max(0.6, d * 0.5)
  const altoFronton = anchoPortico * 0.34

  const anchoVentana = ancho * 0.19
  const altoVentana = altoPiso * 0.46

  /**
   * Ventanas y columnas, fundidas en tres geometrias.
   *
   * Una fachada son once ventanas, y cada ventana quiere marco, vidrio y
   * parteluz: treinta y tres mallas por edificio, por siete edificios que
   * llega a poner una escena. Como ninguna se mueve, se fusionan de una vez
   * en tres piezas (marcos, vidrios y columnas) y el edificio entero pasa de
   * unas cuarenta llamadas de dibujo a menos de veinte.
   */
  const piezas = useMemo(() => {
    const marcos: THREE.BufferGeometry[] = []
    const vidrios: THREE.BufferGeometry[] = []

    // Tres ventanas por piso en la fachada. En la planta baja el hueco del
    // centro es la puerta, asi que esa se salta.
    for (let f = 0; f < pisos; f++) {
      for (let c = -1; c <= 1; c++) {
        if (f === 0 && c === 0) continue
        const x = c * ancho * 0.3
        const y = yBase + altoPiso * (f + 0.55)

        const marco = new THREE.PlaneGeometry(anchoVentana * 1.24, altoVentana * 1.22)
        marco.translate(x, y, frente + 0.02)
        marcos.push(marco)

        // El vidrio va partido en dos hojas con una junta al medio: de una
        // sola pieza, las ventanas son rectangulos amarillos y el edificio
        // parece una hoja de calculo.
        for (const lado of [-1, 1]) {
          const hoja = new THREE.PlaneGeometry(anchoVentana * 0.45, altoVentana)
          hoja.translate(x + lado * anchoVentana * 0.26, y, frente + 0.035)
          vidrios.push(hoja)
        }
      }
    }

    // Ventanas de los costados, para que el edificio no sea plano de perfil.
    for (const lado of [-1, 1]) {
      for (let f = 0; f < pisos; f++) {
        const g = new THREE.PlaneGeometry(fondo * 0.3, altoVentana)
        g.rotateY((lado * Math.PI) / 2)
        g.translate(lado * (ancho / 2 + 0.02), yBase + altoPiso * (f + 0.55), 0)
        vidrios.push(g)
      }
    }

    // Las cuatro columnas del portico, tambien en una sola pieza.
    const columnas: THREE.BufferGeometry[] = []
    for (const k of [-1.5, -0.5, 0.5, 1.5]) {
      const g = new THREE.CylinderGeometry(anchoPortico * 0.062, anchoPortico * 0.07, altoColumna, 10)
      g.translate((k * anchoPortico) / 3.4, yBase + altoColumna / 2, frente + fondoPortico * 0.72)
      columnas.push(g)
    }

    const unir = (lista: THREE.BufferGeometry[]) => {
      const merged = mergeGeometries(lista)
      lista.forEach((g) => g.dispose())
      return merged
    }
    return { marcos: unir(marcos), vidrios: unir(vidrios), columnas: unir(columnas) }
  }, [pisos, ancho, altoPiso, anchoVentana, altoVentana, fondo, frente, anchoPortico, altoColumna, fondoPortico])

  // Las geometrias fusionadas se crean a mano, asi que hay que soltarlas a
  // mano: la presentacion cambia de escena catorce veces y cada cambio monta
  // edificios nuevos.
  useEffect(
    () => () => {
      piezas.marcos?.dispose()
      piezas.vidrios?.dispose()
      piezas.columnas?.dispose()
    },
    [piezas]
  )

  return (
    <>
      {/* Zocalo y gradas de entrada */}
      <mesh position={[0, yBase / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[ancho * 1.1, yBase, fondo * 1.14]} />
        <meshStandardMaterial color="#e4e7f4" roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={`grada-${i}`} position={[0, 0.055 + i * 0.11, frente + 0.62 - i * 0.2]} receiveShadow>
          <boxGeometry args={[anchoPortico * 1.15, 0.11, 0.42 - i * 0.06]} />
          <meshStandardMaterial color="#eceff8" roughness={0.9} />
        </mesh>
      ))}

      {/* El cuerpo */}
      <mesh position={[0, h / 2 + yBase, 0]} castShadow receiveShadow>
        <boxGeometry args={[ancho, h, fondo]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>

      {/* Nada de alas laterales: las escenas colocan hasta siete edificios en
          una plaza de quince metros, y cualquier volumen que se salga del
          ancho original los hace chocar unos con otros. Todo el caracter del
          edificio tiene que caber dentro de la misma huella de antes. */}

      {/* Cornisa: la linea clara que separa el cuerpo del techo */}
      <mesh position={[0, h + yBase + 0.13, 0]} castShadow>
        <boxGeometry args={[ancho * 1.07, 0.26, fondo * 1.07]} />
        <meshStandardMaterial color={CREMA} roughness={0.8} />
      </mesh>
      {/* Banda entre plantas */}
      {pisos > 2 && (
        <mesh position={[0, yBase + altoPiso * Math.floor(pisos / 2), 0]}>
          <boxGeometry args={[ancho * 1.012, 0.13, fondo * 1.012]} />
          <meshStandardMaterial color={CREMA} roughness={0.85} />
        </mesh>
      )}

      {/* Ventanas: marcos claros y vidrios encendidos, cada grupo en una malla */}
      {piezas.marcos && (
        <mesh geometry={piezas.marcos}>
          <meshStandardMaterial color={CREMA} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}
      {piezas.vidrios && (
        <mesh geometry={piezas.vidrios}>
          <meshStandardMaterial
            color="#fff7d6"
            emissive="#ffe9a3"
            emissiveIntensity={0.4}
            roughness={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* El portico: cuatro columnas, arquitrabe y fronton */}
      {piezas.columnas && (
        <mesh geometry={piezas.columnas} castShadow>
          <meshStandardMaterial color={CREMA} roughness={0.7} />
        </mesh>
      )}
      <mesh position={[0, yBase + altoColumna + 0.13, frente + fondoPortico * 0.4]} castShadow>
        <boxGeometry args={[anchoPortico * 1.06, 0.26, fondoPortico * 1.5]} />
        <meshStandardMaterial color={CREMA} roughness={0.75} />
      </mesh>
      <mesh
        geometry={GEO_FRONTON}
        // La base del prisma esta en y=-0.5 de su escala: se sube esa mitad
        // para que apoye justo encima del arquitrabe.
        position={[
          0,
          yBase + altoColumna + 0.26 + (altoFronton / 1.5) * 0.5,
          frente + fondoPortico * 0.4,
        ]}
        scale={[anchoPortico / 1.732, altoFronton / 1.5, fondoPortico * 1.5]}
        castShadow
      >
        <meshStandardMaterial color={CREMA} roughness={0.75} />
      </mesh>
      {/* El ojo de buey del fronton */}
      <mesh position={[0, yBase + altoColumna + 0.26 + altoFronton * 0.3, frente + fondoPortico * 1.16]}>
        <circleGeometry args={[altoFronton * 0.19, 14]} />
        <meshStandardMaterial color={TECHO} roughness={0.6} />
      </mesh>

      {/* La puerta, bajo el portico */}
      <mesh position={[0, yBase + altoPiso * 0.42, frente + 0.02]}>
        <planeGeometry args={[ancho * 0.2, altoPiso * 0.84]} />
        <meshStandardMaterial color={TECHO} roughness={0.55} />
      </mesh>
      <mesh position={[0, yBase + altoPiso * 0.84, frente + 0.03]}>
        <circleGeometry args={[ancho * 0.1, 16, 0, Math.PI]} />
        <meshStandardMaterial color={TECHO} roughness={0.55} />
      </mesh>

      {/* El techo a cuatro aguas y su reloj */}
      <mesh position={[0, h + yBase + 0.81, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[w * 1.55, 1.1, 4]} />
        <meshStandardMaterial color={TECHO} roughness={0.65} />
      </mesh>
      <mesh position={[0, h + yBase + 1.62, 0]} castShadow>
        <cylinderGeometry args={[w * 0.27, w * 0.3, 1, 10]} />
        <meshStandardMaterial color={CREMA} roughness={0.7} />
      </mesh>
      <mesh position={[0, h + yBase + 1.72, w * 0.28]}>
        <circleGeometry args={[w * 0.17, 16]} />
        <meshStandardMaterial color="#fff7d6" emissive="#ffe9a3" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      {/* La aguja NO puede ser mas ancha que la torre: con el radio mayor que
          el del campanario, el remate parecia un hongo en vez de un chapitel. */}
      <mesh position={[0, h + yBase + 2.62, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[w * 0.28, 1, 4]} />
        <meshStandardMaterial color={TECHO} roughness={0.6} />
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
  const esEdificio = variant === 'edificio'
  // El edificio termina en torre de reloj y aguja: el rotulo y el banderin
  // tienen que apartarse o quedan clavados dentro del campanario.
  // Los rotulos se escalonan segun lo atras que este el edificio: los del
  // fondo suben y los de adelante bajan. Sin esto, cinco sedes repartidas en
  // dos filas dentro de una plaza de quince metros acaban con los cinco
  // carteles amontonados en la misma franja de pantalla y no se lee ninguno.
  const escalonRotulo = Math.max(0, 6 - z) * 0.22
  const signY = esGlobo
    ? h + Math.max(1.5, w * 1.35) * 2 + 0.9
    : // El edificio termina en aguja a h + 3.46; el rotulo arranca por encima.
      (esEdificio ? h + 4 : h + 3) + escalonRotulo
  const flagPos: [number, number, number] = esEdificio
    ? // Asta plantada al lado de la entrada: sobre el techo chocaba con el
      // campanario, y la fachada ya tiene bastante encima.
      [-(w * 1.9 * 0.5 + 0.55), 1.05, d * 1.5 * 0.4]
    : [0, 0.16 + h + 1.05, 0]

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
        <group position={flagPos}>
          <mesh castShadow>
            <cylinderGeometry args={[0.045, 0.055, 2.1, 8]} />
            <meshStandardMaterial color="#1a2d62" roughness={0.5} />
          </mesh>
          <mesh ref={flagRef} position={[0.62, 0.7, 0]}>
            <coneGeometry args={[0.34, 1.15, 3]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} roughness={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
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
