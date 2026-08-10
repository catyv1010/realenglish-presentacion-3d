import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'
import { makeRng, pick, range } from './rng'
import { isFreeGround } from './layout'

/**
 * La multitud del campus.
 *
 * Las personas de `CampusPeople` son las protagonistas: tienen pose propia,
 * leen, gesticulan y dan clase. Pero son ocho piezas de geometria cada una, y
 * a partir de treinta el campus empieza a costar caro en llamadas de dibujo.
 *
 * Esta es la otra mitad: setenta figuras mas, todas dibujadas con
 * InstancedMesh. Seis llamadas de dibujo para setenta personas en vez de
 * quinientas sesenta. Caminan, se balancean de pie y se sientan en el zacate
 * igual que las protagonistas; lo que no hacen es tener pose unica, y a la
 * distancia a la que estan nadie lo nota.
 *
 * Las piernas y los brazos van en un solo InstancedMesh con dos instancias
 * por persona (indices 2i y 2i+1). Por eso los bucles de color y de matriz
 * llevan esa cuenta doble.
 */

const ROPA = ['#525fe1', '#f26b65', '#FF7700', '#f9a03f', '#22c55e', '#8b93f8', '#1a2d62', '#e879f9', '#0ea5e9', '#14b8a6']
const PIELES = ['#f2c9a0', '#e0a97e', '#c68863', '#a06a45', '#8d5524', '#f5d5b8']
const PELOS = ['#2b1d14', '#4a3121', '#151515', '#6b4423', '#8c6239', '#3b2f2f']
const PANTALON = ['#2f3a56', '#3f4a6b', '#1f2937', '#4b5563', '#5b4636']

/* Geometria mas barata que la de las protagonistas: estas figuras nunca estan
   cerca del lente, asi que seis lados sobran y ahorran miles de triangulos. */
const GEO = {
  pierna: new THREE.CylinderGeometry(0.075, 0.065, 0.72, 5),
  brazo: new THREE.CylinderGeometry(0.06, 0.055, 0.62, 5),
  torso: new THREE.CapsuleGeometry(0.19, 0.42, 3, 6),
  cabeza: new THREE.SphereGeometry(0.16, 8, 6),
  pelo: new THREE.SphereGeometry(0.168, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.62),
  mochila: new THREE.BoxGeometry(0.26, 0.32, 0.14),
}

type Pose = 'camina' | 'parado' | 'sentado'

interface Figura {
  pose: Pose
  /** Para los que caminan: el circulo que recorren. Para el resto, su sitio. */
  x: number
  z: number
  radio: number
  velocidad: number
  angulo: number
  giro: number
  fase: number
  piel: THREE.Color
  ropa: THREE.Color
  pelo: THREE.Color
  pantalon: THREE.Color
  mochila: THREE.Color | null
}

interface CampusCrowdProps {
  quality: QualityLevel
}

export function CampusCrowd({ quality }: CampusCrowdProps) {
  // Subir esto no cuesta llamadas de dibujo, solo matrices: el campus se llena
  // de gente por el lado barato. Lo que hay que vigilar es CampusPeople.
  const nFiguras = quality === 'high' ? 100 : quality === 'medium' ? 55 : 18

  const figuras = useMemo<Figura[]>(() => {
    const rng = makeRng(880511)
    const lista: Figura[] = []
    let intentos = 0

    while (lista.length < nFiguras && intentos < nFiguras * 60) {
      intentos++

      // Un tercio camina en circulos anchos, el resto llena el zacate.
      const pose: Pose = lista.length % 3 === 0 ? 'camina' : rng() > 0.45 ? 'parado' : 'sentado'

      const color = {
        piel: new THREE.Color(pick(rng, PIELES)),
        ropa: new THREE.Color(pick(rng, ROPA)),
        pelo: new THREE.Color(pick(rng, PELOS)),
        pantalon: new THREE.Color(pick(rng, PANTALON)),
        mochila: rng() > 0.5 ? new THREE.Color(pick(rng, ROPA)) : null,
      }

      if (pose === 'camina') {
        // Anillos por fuera del sendero de las protagonistas, para que no se
        // metan unas dentro de otras.
        const radio = range(rng, 15.5, 33)
        lista.push({
          pose,
          x: 0,
          z: 0,
          radio,
          velocidad: (rng() > 0.5 ? 1 : -1) * range(rng, 0.035, 0.085),
          angulo: rng() * Math.PI * 2,
          giro: 0,
          fase: rng() * 6.28,
          ...color,
        })
        continue
      }

      const a = rng() * Math.PI * 2
      const r = range(rng, 15, 46)
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      // Alto 1.9: una persona no tapa la presentacion como si fuera un arbol,
      // pero tampoco puede plantarse en medio del pasillo de la camara.
      if (!isFreeGround(x, z, 1.9)) continue
      if (lista.some((f) => f.pose !== 'camina' && (f.x - x) ** 2 + (f.z - z) ** 2 < 2.2)) continue

      lista.push({
        pose,
        x,
        z,
        radio: 0,
        velocidad: 0,
        angulo: 0,
        // Mirando hacia el centro del campus, con algo de desorden.
        giro: Math.atan2(-x, -z) + range(rng, -0.9, 0.9),
        fase: rng() * 6.28,
        ...color,
      })
    }
    return lista
  }, [nFiguras])

  const piernas = useRef<THREE.InstancedMesh>(null)
  const brazos = useRef<THREE.InstancedMesh>(null)
  const torsos = useRef<THREE.InstancedMesh>(null)
  const cabezas = useRef<THREE.InstancedMesh>(null)
  const pelos = useRef<THREE.InstancedMesh>(null)
  const mochilas = useRef<THREE.InstancedMesh>(null)

  /* Los colores no cambian nunca: se pintan una sola vez al montar. */
  useLayoutEffect(() => {
    figuras.forEach((f, i) => {
      piernas.current?.setColorAt(i * 2, f.pantalon)
      piernas.current?.setColorAt(i * 2 + 1, f.pantalon)
      brazos.current?.setColorAt(i * 2, f.ropa)
      brazos.current?.setColorAt(i * 2 + 1, f.ropa)
      torsos.current?.setColorAt(i, f.ropa)
      cabezas.current?.setColorAt(i, f.piel)
      pelos.current?.setColorAt(i, f.pelo)
      mochilas.current?.setColorAt(i, f.mochila ?? f.ropa)
    })
    for (const ref of [piernas, brazos, torsos, cabezas, pelos, mochilas]) {
      if (ref.current?.instanceColor) ref.current.instanceColor.needsUpdate = true
    }
  }, [figuras])

  /* Objetos de trabajo reutilizados: crear un Matrix4 por persona y por cuadro
     seria basura para el recolector sesenta veces por segundo. */
  const tmp = useMemo(() => {
    const desplazarPierna = new THREE.Matrix4().makeTranslation(0, -0.36, 0)
    const desplazarBrazo = new THREE.Matrix4().makeTranslation(0, -0.31, 0)
    return {
      persona: new THREE.Matrix4(),
      local: new THREE.Matrix4(),
      final: new THREE.Matrix4(),
      p: new THREE.Vector3(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(),
      uno: new THREE.Vector3(1, 1, 1),
      nada: new THREE.Vector3(0.0001, 0.0001, 0.0001),
      fuera: new THREE.Vector3(0, -60, 0),
      desplazarPierna,
      desplazarBrazo,
    }
  }, [])

  useFrame((state) => {
    if (!piernas.current || !brazos.current || !torsos.current) return
    const t = state.clock.elapsedTime

    for (let i = 0; i < figuras.length; i++) {
      const f = figuras[i]
      const sentado = f.pose === 'sentado'
      const yCadera = sentado ? 0.34 : 0.72
      const yTorso = yCadera + 0.36
      const yCabeza = yTorso + 0.46

      let px = f.x
      let pz = f.z
      let giro = f.giro
      let bob = 0
      let paso = 0

      if (f.pose === 'camina') {
        const a = f.angulo + t * f.velocidad
        px = Math.cos(a) * f.radio
        pz = Math.sin(a) * f.radio
        giro = -a + (f.velocidad > 0 ? Math.PI / 2 : -Math.PI / 2)
        paso = Math.sin(t * f.velocidad * 9 + f.fase)
        bob = Math.abs(paso) * 0.045
      } else if (f.pose === 'parado') {
        // De pie nadie se queda como un poste: el peso pasa de un pie al otro.
        giro = f.giro + Math.sin(t * 0.45 + f.fase) * 0.16
        paso = Math.sin(t * 0.9 + f.fase) * 0.08
      }

      tmp.persona.compose(
        tmp.p.set(px, bob, pz),
        tmp.q.setFromEuler(tmp.e.set(0, giro, 0)),
        tmp.uno
      )

      // Piernas: cruzadas y quietas si esta sentado, en marcha si camina.
      const anguloIzq = sentado ? -1.35 : paso * 0.7
      const anguloDer = sentado ? -1.35 : -paso * 0.7
      const torsionIzq = sentado ? 0.25 : 0
      const torsionDer = sentado ? -0.25 : 0

      tmp.local.compose(tmp.p.set(-0.1, yCadera, 0), tmp.q.setFromEuler(tmp.e.set(anguloIzq, torsionIzq, 0)), tmp.uno)
      tmp.local.multiply(tmp.desplazarPierna)
      piernas.current.setMatrixAt(i * 2, tmp.final.multiplyMatrices(tmp.persona, tmp.local))

      tmp.local.compose(tmp.p.set(0.1, yCadera, 0), tmp.q.setFromEuler(tmp.e.set(anguloDer, torsionDer, 0)), tmp.uno)
      tmp.local.multiply(tmp.desplazarPierna)
      piernas.current.setMatrixAt(i * 2 + 1, tmp.final.multiplyMatrices(tmp.persona, tmp.local))

      // Brazos: contrarios a las piernas, como al andar de verdad.
      tmp.local.compose(tmp.p.set(-0.24, yTorso + 0.2, 0), tmp.q.setFromEuler(tmp.e.set(-paso * 0.55, 0, 0)), tmp.uno)
      tmp.local.multiply(tmp.desplazarBrazo)
      brazos.current.setMatrixAt(i * 2, tmp.final.multiplyMatrices(tmp.persona, tmp.local))

      tmp.local.compose(tmp.p.set(0.24, yTorso + 0.2, 0), tmp.q.setFromEuler(tmp.e.set(paso * 0.55, 0, 0)), tmp.uno)
      tmp.local.multiply(tmp.desplazarBrazo)
      brazos.current.setMatrixAt(i * 2 + 1, tmp.final.multiplyMatrices(tmp.persona, tmp.local))

      tmp.local.compose(tmp.p.set(0, yTorso, 0), tmp.q.identity(), tmp.uno)
      torsos.current.setMatrixAt(i, tmp.final.multiplyMatrices(tmp.persona, tmp.local))

      if (cabezas.current) {
        tmp.local.compose(tmp.p.set(0, yCabeza, 0), tmp.q.identity(), tmp.uno)
        cabezas.current.setMatrixAt(i, tmp.final.multiplyMatrices(tmp.persona, tmp.local))
      }
      if (pelos.current) {
        tmp.local.compose(tmp.p.set(0, yCabeza + 0.012, 0), tmp.q.identity(), tmp.uno)
        pelos.current.setMatrixAt(i, tmp.final.multiplyMatrices(tmp.persona, tmp.local))
      }
      if (mochilas.current) {
        if (f.mochila) {
          tmp.local.compose(tmp.p.set(0, yTorso + 0.02, -0.22), tmp.q.identity(), tmp.uno)
          mochilas.current.setMatrixAt(i, tmp.final.multiplyMatrices(tmp.persona, tmp.local))
        } else {
          // Sin mochila: la instancia se manda bajo tierra y se encoge.
          mochilas.current.setMatrixAt(i, tmp.final.compose(tmp.fuera, tmp.q.identity(), tmp.nada))
        }
      }
    }

    for (const ref of [piernas, brazos, torsos, cabezas, pelos, mochilas]) {
      if (ref.current) ref.current.instanceMatrix.needsUpdate = true
    }
  })

  const n = Math.max(1, figuras.length)

  return (
    <group>
      <instancedMesh ref={piernas} args={[GEO.pierna, undefined, n * 2]} castShadow>
        <meshStandardMaterial roughness={0.8} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={brazos} args={[GEO.brazo, undefined, n * 2]}>
        <meshStandardMaterial roughness={0.8} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={torsos} args={[GEO.torso, undefined, n]} castShadow>
        <meshStandardMaterial roughness={0.8} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={cabezas} args={[GEO.cabeza, undefined, n]} castShadow>
        <meshStandardMaterial roughness={0.85} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={pelos} args={[GEO.pelo, undefined, n]}>
        <meshStandardMaterial roughness={0.9} metalness={0} />
      </instancedMesh>
      <instancedMesh ref={mochilas} args={[GEO.mochila, undefined, n]}>
        <meshStandardMaterial roughness={0.85} metalness={0} />
      </instancedMesh>
    </group>
  )
}
