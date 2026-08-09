import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { QualityLevel } from '../../../types/presentation'
import { makeRng, pick, range } from './rng'
import { isFreeGround } from './layout'

/* Paleta tropical: verdes de Costa Rica, ni fosforescentes ni apagados. */
const VERDES = ['#4f9d52', '#3f8a45', '#62b262', '#57a85c', '#7cc27a', '#48934f']
const VERDES_PALMA = ['#3f9152', '#4aa25c', '#357f46']
const TRONCOS = ['#6b4a34', '#7a5740', '#5c3f2d', '#8a6a4f']
const FLORES = ['#f26b65', '#f9a03f', '#ffd166', '#e879f9', '#ffffff', '#ff8fa3']

type Especie = 'copa' | 'pino' | 'palma'

interface Arbol {
  x: number
  z: number
  altura: number
  ancho: number
  especie: Especie
  troncoColor: string
  hojaColor: string
  giro: number
  fase: number
}

/** Datos de una pieza de follaje que se mece con el viento. */
interface Follaje {
  base: THREE.Vector3
  escala: THREE.Vector3
  color: THREE.Color
  fase: number
  amplitud: number
  giroY: number
  inclinacion: number
}

interface CampusFloraProps {
  quality: QualityLevel
}

/**
 * La vegetacion del campus: un bosque alrededor de la plaza con tres especies
 * (copa redonda, pino y palmera), mas matas de zacate y flores en el suelo.
 *
 * Todo se dibuja con InstancedMesh: sesenta arboles y casi mil matas de
 * zacate salen en seis llamadas de dibujo en vez de miles. El follaje se mece
 * moviendo las matrices de instancia, que es puro calculo de CPU barato y no
 * necesita shaders propios.
 */
export function CampusFlora({ quality }: CampusFloraProps) {
  const nArboles = quality === 'high' ? 66 : quality === 'medium' ? 42 : 24
  const nZacate = quality === 'high' ? 900 : quality === 'medium' ? 480 : 200
  const nFlores = quality === 'high' ? 300 : quality === 'medium' ? 160 : 70
  const nArbustos = quality === 'high' ? 54 : quality === 'medium' ? 30 : 14

  /* ---------------- Reparto de los arboles en el terreno ---------------- */
  const arboles = useMemo<Arbol[]>(() => {
    const rng = makeRng(20260809)
    const lista: Arbol[] = []
    let intentos = 0

    while (lista.length < nArboles && intentos < nArboles * 60) {
      intentos++
      const a = rng() * Math.PI * 2
      const r = range(rng, 19, 56)
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r

      if (!isFreeGround(x, z)) continue
      // Que no se amontonen unos encima de otros.
      if (lista.some((t) => (t.x - x) ** 2 + (t.z - z) ** 2 < 16)) continue

      // Las palmeras viven en el borde soleado, los pinos hacia el fondo.
      const especie: Especie = r > 40 ? pick(rng, ['pino', 'copa', 'copa'] as const)
        : r > 26 ? pick(rng, ['copa', 'copa', 'pino', 'palma'] as const)
        : pick(rng, ['copa', 'palma', 'copa'] as const)

      lista.push({
        x,
        z,
        altura: especie === 'palma' ? range(rng, 6.5, 10.5) : range(rng, 4.5, 9),
        ancho: range(rng, 0.85, 1.35),
        especie,
        troncoColor: pick(rng, TRONCOS),
        hojaColor: pick(rng, especie === 'palma' ? VERDES_PALMA : VERDES),
        giro: rng() * Math.PI * 2,
        fase: rng() * Math.PI * 2,
      })
    }
    return lista
  }, [nArboles])

  /* ---------------- Geometrias e instancias ---------------- */
  // Un cilindro de altura 1 con la base en y=0: asi la escala del tronco es
  // directamente su altura y el arbol nunca queda enterrado ni flotando.
  const geoTronco = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.5, 0.72, 1, 7)
    g.translate(0, 0.5, 0)
    return g
  }, [])
  const geoCopa = useMemo(() => new THREE.IcosahedronGeometry(1, 1), [])
  const geoCono = useMemo(() => {
    const g = new THREE.ConeGeometry(1, 1, 8)
    g.translate(0, 0.5, 0)
    return g
  }, [])
  const geoHoja = useMemo(() => {
    const g = new THREE.ConeGeometry(0.42, 1, 4)
    g.translate(0, 0.5, 0)
    return g
  }, [])
  // Una mata de zacate son tres briznas cruzadas, no un cono suelto: con un
  // solo cono el suelo parecia sembrado de pinos enanos (si era alto) o de
  // piedras verdes (si era bajo). Las tres briznas se fusionan en una sola
  // geometria para que sigan siendo una sola instancia.
  const geoZacate = useMemo(() => {
    const brizna = new THREE.ConeGeometry(0.055, 0.5, 3)
    brizna.translate(0, 0.25, 0)
    const partes: THREE.BufferGeometry[] = []
    for (let i = 0; i < 3; i++) {
      const b = brizna.clone()
      b.rotateZ((i - 1) * 0.38)
      b.rotateY(i * 1.2)
      b.translate((i - 1) * 0.07, 0, (i % 2) * 0.06)
      partes.push(b)
    }
    const merged = mergeGeometries(partes) ?? brizna.clone()
    brizna.dispose()
    partes.forEach((p) => p.dispose())
    return merged
  }, [])
  // Una flor es tallo + botón. Solo el botón (una esfera suelta en el aire) se
  // veía como una bolita de chicle tirada en el zacate.
  const geoFlor = useMemo(() => {
    const tallo = new THREE.CylinderGeometry(0.012, 0.016, 0.34, 4)
    tallo.translate(0, 0.17, 0)
    const boton = new THREE.SphereGeometry(0.075, 6, 5)
    boton.translate(0, 0.36, 0)
    const merged = mergeGeometries([tallo, boton]) ?? boton.clone()
    tallo.dispose()
    boton.dispose()
    return merged
  }, [])
  // Arbustos: tres bolas pegadas. Llenan el hueco de altura que quedaba entre
  // el zacate (medio metro) y los arboles (seis metros), que es justo lo que
  // hacia que el campus se viera vacio a media altura.
  const geoArbusto = useMemo(() => {
    const partes: THREE.BufferGeometry[] = []
    const posiciones: [number, number, number][] = [
      [0, 0.5, 0],
      [0.55, 0.34, 0.2],
      [-0.45, 0.38, -0.25],
    ]
    const escalas = [0.62, 0.44, 0.48]
    posiciones.forEach((p, i) => {
      const b = new THREE.IcosahedronGeometry(escalas[i], 1)
      b.translate(p[0], p[1], p[2])
      partes.push(b)
    })
    const merged = mergeGeometries(partes) ?? new THREE.IcosahedronGeometry(0.6, 1)
    partes.forEach((p) => p.dispose())
    return merged
  }, [])

  const troncos = useRef<THREE.InstancedMesh>(null)
  const copas = useRef<THREE.InstancedMesh>(null)
  const conos = useRef<THREE.InstancedMesh>(null)
  const hojas = useRef<THREE.InstancedMesh>(null)
  const zacate = useRef<THREE.InstancedMesh>(null)
  const flores = useRef<THREE.InstancedMesh>(null)
  const arbustos = useRef<THREE.InstancedMesh>(null)

  // Se arma una lista por tipo de follaje para poder mecerlas por separado.
  const { copasData, conosData, hojasData } = useMemo(() => {
    const rng = makeRng(777)
    const copasData: Follaje[] = []
    const conosData: Follaje[] = []
    const hojasData: Follaje[] = []

    for (const t of arboles) {
      if (t.especie === 'copa') {
        // La copa arranca a dos tercios del tronco y es ancha: con la copa
        // arriba del todo los arboles parecian paletas de caramelo.
        const rBase = t.ancho * 2.6
        const alturaCopa = t.altura * 0.66
        for (let i = 0; i < 3; i++) {
          const dx = Math.cos(t.giro + i * 2.3) * rBase * 0.46
          const dz = Math.sin(t.giro + i * 2.3) * rBase * 0.46
          const s = rBase * (i === 0 ? 1 : 0.7)
          copasData.push({
            base: new THREE.Vector3(t.x + dx, alturaCopa + (i === 0 ? 0.55 : 0.1) * rBase, t.z + dz),
            escala: new THREE.Vector3(s, s * 0.82, s),
            color: new THREE.Color(t.hojaColor).offsetHSL(0, 0, (i - 1) * 0.03),
            fase: t.fase + i,
            amplitud: 0.1 + rng() * 0.12,
            giroY: t.giro,
            inclinacion: 0,
          })
        }
      } else if (t.especie === 'pino') {
        for (let i = 0; i < 3; i++) {
          const s = t.ancho * (2.6 - i * 0.62)
          const h = t.altura * (0.3 + i * 0.26)
          conosData.push({
            base: new THREE.Vector3(t.x, h, t.z),
            escala: new THREE.Vector3(s, t.altura * 0.42, s),
            color: new THREE.Color(t.hojaColor).offsetHSL(0, 0, -i * 0.03),
            fase: t.fase + i * 0.7,
            amplitud: 0.05 + rng() * 0.06,
            giroY: t.giro,
            inclinacion: 0,
          })
        }
      } else {
        const nHojas = 7
        for (let i = 0; i < nHojas; i++) {
          const a = t.giro + (i / nHojas) * Math.PI * 2
          hojasData.push({
            base: new THREE.Vector3(t.x, t.altura, t.z),
            escala: new THREE.Vector3(t.ancho * 1.1, t.ancho * 3.4, t.ancho * 1.1),
            color: new THREE.Color(t.hojaColor).offsetHSL(0, 0, (i % 3) * 0.025),
            fase: t.fase + i * 0.5,
            amplitud: 0.16 + rng() * 0.14,
            giroY: a,
            inclinacion: 1.05 + (i % 2) * 0.18,
          })
        }
      }
    }
    return { copasData, conosData, hojasData }
  }, [arboles])

  /* ---------------- Colocacion inicial ---------------- */
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const pos = new THREE.Vector3()
    const esc = new THREE.Vector3()

    // Troncos
    if (troncos.current) {
      arboles.forEach((t, i) => {
        const esPalma = t.especie === 'palma'
        pos.set(t.x, 0, t.z)
        esc.set(t.ancho * (esPalma ? 0.42 : 0.62), t.altura, t.ancho * (esPalma ? 0.42 : 0.62))
        e.set(0, t.giro, esPalma ? Math.sin(t.fase) * 0.06 : 0)
        m.compose(pos, q.setFromEuler(e), esc)
        troncos.current!.setMatrixAt(i, m)
        troncos.current!.setColorAt(i, new THREE.Color(t.troncoColor))
      })
      troncos.current.instanceMatrix.needsUpdate = true
      if (troncos.current.instanceColor) troncos.current.instanceColor.needsUpdate = true
    }

    // Colores del follaje (las posiciones las pone el viento en cada cuadro)
    const pintar = (ref: THREE.InstancedMesh | null, data: Follaje[]) => {
      if (!ref) return
      data.forEach((d, i) => ref.setColorAt(i, d.color))
      if (ref.instanceColor) ref.instanceColor.needsUpdate = true
    }
    pintar(copas.current, copasData)
    pintar(conos.current, conosData)
    pintar(hojas.current, hojasData)

    // Zacate y flores: estaticos, se colocan una sola vez.
    const rng = makeRng(31415)
    const colocarSuelo = (ref: THREE.InstancedMesh | null, n: number, esFlor: boolean) => {
      if (!ref) return
      let puestos = 0
      let intentos = 0
      while (puestos < n && intentos < n * 25) {
        intentos++
        const a = rng() * Math.PI * 2
        const r = range(rng, 13, esFlor ? 34 : 52)
        const x = Math.cos(a) * r
        const z = Math.sin(a) * r
        if (!isFreeGround(x, z, 1.2)) continue
        const s = esFlor ? range(rng, 0.75, 1.35) : range(rng, 0.7, 1.4)
        pos.set(x, 0, z)
        e.set(0, rng() * Math.PI, range(rng, -0.1, 0.1))
        esc.set(s, s, s)
        m.compose(pos, q.setFromEuler(e), esc)
        ref.setMatrixAt(puestos, m)
        ref.setColorAt(
          puestos,
          esFlor
            ? new THREE.Color(pick(rng, FLORES))
            : new THREE.Color(pick(rng, VERDES)).offsetHSL(0, -0.08, range(rng, 0.06, 0.16))
        )
        puestos++
      }
      // Las que no cupieron se mandan bajo tierra para que no se vean.
      for (let i = puestos; i < n; i++) {
        m.compose(pos.set(0, -50, 0), q.identity(), esc.set(0.001, 0.001, 0.001))
        ref.setMatrixAt(i, m)
      }
      ref.instanceMatrix.needsUpdate = true
      if (ref.instanceColor) ref.instanceColor.needsUpdate = true
    }
    colocarSuelo(zacate.current, nZacate, false)
    colocarSuelo(flores.current, nFlores, true)

    // Arbustos: se apoyan en el mismo mapa de zonas libres que los arboles,
    // pero pueden acercarse mas a la plaza porque no tapan nada.
    if (arbustos.current) {
      const rngA = makeRng(2024)
      let puestos = 0
      let intentos = 0
      while (puestos < nArbustos && intentos < nArbustos * 40) {
        intentos++
        const a = rngA() * Math.PI * 2
        const r = range(rngA, 14, 40)
        const x = Math.cos(a) * r
        const z = Math.sin(a) * r
        if (!isFreeGround(x, z, 1.9)) continue
        const t = range(rngA, 0.75, 1.6)
        pos.set(x, 0, z)
        e.set(0, rngA() * Math.PI * 2, 0)
        esc.set(t, t * range(rngA, 0.8, 1.15), t)
        m.compose(pos, q.setFromEuler(e), esc)
        arbustos.current.setMatrixAt(puestos, m)
        arbustos.current.setColorAt(puestos, new THREE.Color(pick(rngA, VERDES)).offsetHSL(0, 0.02, range(rngA, -0.06, 0.04)))
        puestos++
      }
      for (let i = puestos; i < nArbustos; i++) {
        m.compose(pos.set(0, -50, 0), q.identity(), esc.set(0.001, 0.001, 0.001))
        arbustos.current.setMatrixAt(i, m)
      }
      arbustos.current.instanceMatrix.needsUpdate = true
      if (arbustos.current.instanceColor) arbustos.current.instanceColor.needsUpdate = true
    }
  }, [arboles, copasData, conosData, hojasData, nZacate, nFlores, nArbustos])

  /* ---------------- El viento ---------------- */
  const tmp = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(),
      p: new THREE.Vector3(),
      s: new THREE.Vector3(),
    }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const mecer = (ref: THREE.InstancedMesh | null, data: Follaje[], velocidad: number) => {
      if (!ref) return
      for (let i = 0; i < data.length; i++) {
        const d = data[i]
        const onda = Math.sin(t * velocidad + d.fase)
        const onda2 = Math.cos(t * velocidad * 0.7 + d.fase * 1.3)
        tmp.p.set(d.base.x + onda * d.amplitud, d.base.y + onda2 * d.amplitud * 0.35, d.base.z + onda2 * d.amplitud)
        tmp.e.set(d.inclinacion + onda * d.amplitud * 0.35, d.giroY, onda2 * d.amplitud * 0.25)
        tmp.m.compose(tmp.p, tmp.q.setFromEuler(tmp.e), tmp.s.copy(d.escala))
        ref.setMatrixAt(i, tmp.m)
      }
      ref.instanceMatrix.needsUpdate = true
    }

    mecer(copas.current, copasData, 0.9)
    mecer(conos.current, conosData, 0.7)
    mecer(hojas.current, hojasData, 1.15)
  })

  return (
    <group>
      <instancedMesh ref={troncos} args={[geoTronco, undefined, Math.max(1, arboles.length)]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.95} metalness={0} />
      </instancedMesh>

      <instancedMesh ref={copas} args={[geoCopa, undefined, Math.max(1, copasData.length)]} castShadow>
        <meshStandardMaterial roughness={0.85} metalness={0} flatShading />
      </instancedMesh>

      <instancedMesh ref={conos} args={[geoCono, undefined, Math.max(1, conosData.length)]} castShadow>
        <meshStandardMaterial roughness={0.9} metalness={0} flatShading />
      </instancedMesh>

      <instancedMesh ref={hojas} args={[geoHoja, undefined, Math.max(1, hojasData.length)]} castShadow>
        <meshStandardMaterial roughness={0.8} metalness={0} side={THREE.DoubleSide} flatShading />
      </instancedMesh>

      <instancedMesh ref={zacate} args={[geoZacate, undefined, nZacate]}>
        <meshStandardMaterial roughness={1} metalness={0} />
      </instancedMesh>

      <instancedMesh ref={flores} args={[geoFlor, undefined, nFlores]}>
        <meshStandardMaterial roughness={0.7} metalness={0} emissiveIntensity={0.1} />
      </instancedMesh>

      <instancedMesh ref={arbustos} args={[geoArbusto, undefined, nArbustos]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.92} metalness={0} flatShading />
      </instancedMesh>
    </group>
  )
}
