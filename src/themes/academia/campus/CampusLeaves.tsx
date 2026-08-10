import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'
import { makeRng, pick, range } from './rng'

const COLORES = ['#f9a03f', '#f26b65', '#ffd166', '#e8a0d8', '#ffffff', '#7cc27a', '#ff8fa3']

interface Hoja {
  x: number
  z: number
  y: number
  giro: number
  vel: number
  balanceo: number
  fase: number
  escala: number
}

interface CampusLeavesProps {
  quality: QualityLevel
}

/**
 * Hojas y petalos que caen girando sobre el campus.
 *
 * Es el detalle mas barato que existe para que una escena deje de verse
 * congelada: aunque nadie se mueva, siempre hay algo bajando despacio en el
 * aire. Van en una sola InstancedMesh y solo cuestan una matriz por hoja.
 */
export function CampusLeaves({ quality }: CampusLeavesProps) {
  // Pocas y bajitas. Con muchas y altas el cielo se llena de confeti y parece
  // una fiesta, no un campus.
  const n = quality === 'high' ? 80 : quality === 'medium' ? 45 : 20

  const geo = useMemo(() => {
    // Una hoja: dos triangulos formando una lente, no un cuadrado.
    const g = new THREE.CircleGeometry(0.16, 5)
    g.scale(1, 0.55, 1)
    return g
  }, [])

  const malla = useRef<THREE.InstancedMesh>(null)

  const hojas = useMemo<Hoja[]>(() => {
    const rng = makeRng(60606)
    const lista: Hoja[] = []
    let intentos = 0

    while (lista.length < n && intentos < n * 40) {
      intentos++
      const a = rng() * Math.PI * 2
      const r = range(rng, 8, 48)
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r

      // Las camaras de las catorce escenas estan todas alrededor de (0, 22), y
      // el disco de reparto pasa justo por encima de ese punto: una hoja de
      // veinte centimetros a un metro del lente tapa media pantalla como una
      // mancha rosada. Se deja libre ese pedazo.
      if (x * x + (z - 22) * (z - 22) < 81) continue

      lista.push({
        x,
        z,
        y: range(rng, 0.5, 11),
        giro: rng() * Math.PI * 2,
        vel: range(rng, 0.5, 1.4),
        balanceo: range(rng, 1.1, 3.2),
        fase: rng() * Math.PI * 2,
        escala: range(rng, 0.7, 1.5),
      })
    }
    return lista
  }, [n])

  useLayoutEffect(() => {
    if (!malla.current) return
    const c = new THREE.Color()
    const rng = makeRng(707)
    for (let i = 0; i < hojas.length; i++) {
      c.set(pick(rng, COLORES))
      malla.current.setColorAt(i, c)
    }
    if (malla.current.instanceColor) malla.current.instanceColor.needsUpdate = true

    // El descarte de la zona de la camara puede dejar menos hojas que
    // instancias reservadas. Las sobrantes se encogen y se entierran: si no,
    // se quedan en el origen con la matriz identidad, apiladas en el centro
    // de la plaza.
    if (hojas.length < n) {
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(0, -50, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(0.0001, 0.0001, 0.0001)
      )
      for (let i = hojas.length; i < n; i++) malla.current.setMatrixAt(i, m)
      malla.current.instanceMatrix.needsUpdate = true
    }
  }, [hojas, n])

  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3() }),
    []
  )

  useFrame((state, delta) => {
    if (!malla.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < hojas.length; i++) {
      const h = hojas[i]
      h.y -= h.vel * delta
      if (h.y < 0.05) h.y = range(makeRng(Math.round(t * 1000) + i), 8, 12)

      // Cae zigzagueando, como una hoja de verdad, no como una piedra.
      const balanceo = Math.sin(t * h.balanceo + h.fase)
      tmp.p.set(h.x + balanceo * 0.9, h.y, h.z + Math.cos(t * h.balanceo * 0.7 + h.fase) * 0.7)
      tmp.e.set(t * h.balanceo * 0.6 + h.fase, h.giro + t * 0.8, balanceo * 0.9)
      tmp.s.set(h.escala, h.escala, h.escala)
      tmp.m.compose(tmp.p, tmp.q.setFromEuler(tmp.e), tmp.s)
      malla.current.setMatrixAt(i, tmp.m)
    }
    malla.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={malla} args={[geo, undefined, n]} frustumCulled={false}>
      <meshStandardMaterial roughness={0.7} metalness={0} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}
