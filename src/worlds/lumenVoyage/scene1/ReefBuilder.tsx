import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Rng, fbm } from '../procedural/math'
import { v3 } from '../procedural/math'
import { tube, sphere } from '../procedural/geometry'

interface ReefBuilderProps {
  seed?: number
  quality: 'low' | 'medium' | 'high'
}

function cuernoCiervo(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  function ram(pos: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, d: number) {
    if (d > 4) {
      parts.push(sphere(pos, rad * 1.35, 5))
      return
    }
    const end = pos.clone().addScaledVector(dir, len)
    parts.push(tube(pos, end, rad, rad * 0.84, 7))
    parts.push(sphere(end, rad * 0.86, 5))
    const n = 2 + (rng.next() < (d < 2 ? 0.6 : 0.25) ? 1 : 0)
    for (let i = 0; i < n; i++) {
      const nd = dir.clone()
      nd.x += rng.range(-0.9, 0.9)
      nd.z += rng.range(-0.9, 0.9)
      nd.y += rng.range(0.28, 0.6)
      ram(end, nd.normalize(), len * rng.range(0.62, 0.78), Math.max(rad * 0.8, 0.075), d + 1)
    }
  }
  ram(v3(0, 0, 0), v3(rng.range(-0.18, 0.18), 1, rng.range(-0.18, 0.18)).normalize(), rng.range(0.42, 0.62), 0.3, 0)
  return mergeGeometries(parts, false)
}

function coralMesa(_rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const h = _rng.range(0.45, 0.85)
  parts.push(tube(v3(0, 0, 0), v3(_rng.range(-0.1, 0.1), h, _rng.range(-0.1, 0.1)), 0.26, 0.2, 9))
  const R = _rng.range(1.1, 1.9)
  const disco = new THREE.CylinderGeometry(R, R * 0.9, 0.18, 30, 3, false)
  const p = disco.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z)
    const a = Math.atan2(z, x)
    const ond = Math.sin(a * _rng.range(5, 9)) * 0.1 + (fbm(x * 2.2 + 13, z * 2.2 + 13) - 0.5) * 0.26
    p.setY(i, p.getY(i) + ond * d - d * d * 0.05)
  }
  disco.computeVertexNormals()
  disco.translate(0, h, 0)
  parts.push(disco)
  return mergeGeometries(parts, false)
}

function coralDedo(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const n = 12 + Math.floor(rng.next() * 14)
  for (let i = 0; i < n; i++) {
    const a = rng.next() * Math.PI * 2
    const r = Math.sqrt(rng.next()) * rng.range(0.45, 1.0)
    const base = v3(Math.cos(a) * r, 0, Math.sin(a) * r)
    const h = rng.range(0.45, 1.35) * (1 - r * 0.35)
    const top = base.clone().add(v3(rng.range(-0.14, 0.14), h, rng.range(-0.14, 0.14)))
    const rad = rng.range(0.13, 0.21)
    parts.push(tube(base, top, rad * 1.05, rad * 0.92, 7))
    parts.push(sphere(top, rad * 0.94, 7))
  }
  return mergeGeometries(parts, false)
}

function cerebro(_rng: Rng) {
  const g = new THREE.IcosahedronGeometry(1, 4)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const n = fbm(x * 2.6 + z * 1.1 + 11, z * 2.6 + y * 1.1 + 11, 4)
    const surco = Math.sin((x + z) * 22 + n * 14) * 0.038 + Math.sin((x - z) * 17) * 0.022
    const s = 1 + (n - 0.5) * 0.34 + surco
    p.setXYZ(i, x * s, Math.max(y * s * 0.62, -0.05), z * s)
  }
  g.computeVertexNormals()
  return g
}

function lechuga(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const n = 3 + Math.floor(rng.next() * 3)
  for (let i = 0; i < n; i++) {
    const Ro = rng.range(0.36, 0.55) + i * 0.19
    const Ri = Ro * rng.range(0.34, 0.5)
    const g = new THREE.RingGeometry(Ri, Ro, 44, 3, 0, Math.PI * rng.range(1.2, 2.0))
    const p = g.attributes.position
    const k = 3 + Math.floor(rng.next() * 3)
    for (let j = 0; j < p.count; j++) {
      const x = p.getX(j), y = p.getY(j)
      const a = Math.atan2(y, x)
      const d = Math.hypot(x, y) - Ri
      p.setZ(j, Math.sin(a * k) * 0.11 * d)
    }
    g.computeVertexNormals()
    g.rotateX(-Math.PI / 2 + rng.range(-0.62, 0.62))
    g.rotateZ(rng.range(-0.35, 0.35))
    g.rotateY(rng.next() * Math.PI * 2)
    g.translate(rng.range(-0.24, 0.24), 0.22 + i * rng.range(0.24, 0.4), rng.range(-0.24, 0.24))
    parts.push(g)
  }
  return mergeGeometries(parts, false)
}

function abanico(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const PROF = 7
  function ram(pos: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, d: number) {
    const end = pos.clone().addScaledVector(dir, len)
    parts.push(tube(pos, end, rad, rad * 0.88, 4))
    if (d >= PROF) return
    for (let i = 0; i < 2; i++) {
      const ang = (i === 0 ? 1 : -1) * rng.range(0.16, 0.34)
      const nd = v3(
        dir.x * Math.cos(ang) - dir.y * Math.sin(ang),
        dir.x * Math.sin(ang) + dir.y * Math.cos(ang),
        rng.range(-0.04, 0.04)
      )
      ram(end, nd.normalize(), len * rng.range(0.8, 0.9), Math.max(rad * 0.88, 0.012), d + 1)
    }
  }
  ram(v3(0, 0, 0), v3(0, 1, 0), rng.range(0.3, 0.42), 0.055, 0)
  return mergeGeometries(parts, false)
}

function anemona(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const base = new THREE.SphereGeometry(0.45, 12, 8)
  base.scale(1, 0.55, 1)
  base.translate(0, 0.16, 0)
  parts.push(base)
  const n = 38
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.range(-0.09, 0.09)
    const rad = rng.range(0.14, 0.44)
    const alto = rng.range(0.65, 1.35)
    const curva = new THREE.CatmullRomCurve3([
      v3(Math.cos(a) * rad * 0.35, 0.2, Math.sin(a) * rad * 0.35),
      v3(Math.cos(a) * rad * 1.1, alto * 0.45, Math.sin(a) * rad * 1.1),
      v3(Math.cos(a) * rad * 2.3, alto * 0.85, Math.sin(a) * rad * 2.3),
      v3(Math.cos(a) * rad * 3.0, alto, Math.sin(a) * rad * 3.0),
    ])
    parts.push(new THREE.TubeGeometry(curva, 6, 0.048, 5, false))
  }
  return mergeGeometries(parts, false)
}

function erizo(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const b = new THREE.SphereGeometry(0.46, 14, 10)
  b.translate(0, 0.46, 0)
  parts.push(b)
  const n = 58
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 1.35
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const th = i * 2.39996
    const d = v3(Math.cos(th) * r, y, Math.sin(th) * r).normalize()
    const a = d.clone().multiplyScalar(0.43).add(v3(0, 0.46, 0))
    const bb = d.clone().multiplyScalar(rng.range(0.8, 1.35)).add(v3(0, 0.46, 0))
    parts.push(tube(a, bb, 0.042, 0.005, 4))
  }
  return mergeGeometries(parts, false)
}

function esponja(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const n = 3 + Math.floor(rng.next() * 4)
  for (let i = 0; i < n; i++) {
    const a = v3(rng.range(-0.4, 0.4), 0, rng.range(-0.4, 0.4))
    const h = rng.range(0.9, 2.1)
    const b = a.clone().add(v3(rng.range(-0.24, 0.24), h, rng.range(-0.24, 0.24)))
    const r = rng.range(0.17, 0.3)
    parts.push(tube(a, b, r * 1.14, r * 0.94, 12))
    const anillo = new THREE.TorusGeometry(r * 0.95, r * 0.12, 5, 12)
    anillo.rotateX(Math.PI / 2)
    anillo.translate(b.x, b.y, b.z)
    parts.push(anillo)
  }
  return mergeGeometries(parts, false)
}

function alga(_rng: Rng) {
  const g = new THREE.PlaneGeometry(0.22, 3.0, 1, 14)
  g.translate(0, 1.5, 0)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / 3.0
    p.setZ(i, Math.sin(t * 3.2) * 0.42 * t)
    p.setX(i, p.getX(i) * (1 - t * 0.55))
  }
  g.computeVertexNormals()
  return g
}

const SPECIES = [
  { gen: cuernoCiervo, n: 0.15, esc: [1.1, 3.1], rug: 0.72, sway: 0.014, shadow: true, plano: false, paleta: [0x2fc7b8, 0x1f8fbe, 0x4ad9c0, 0x5fcf95] },
  { gen: coralMesa, n: 0.1, esc: [0.9, 2.1], rug: 0.7, sway: 0.006, shadow: true, plano: false, paleta: [0xf7548f, 0xc93a78, 0xff7fae, 0xb64ad0] },
  { gen: coralDedo, n: 0.16, esc: [1.0, 2.5], rug: 0.74, sway: 0.01, shadow: false, plano: false, paleta: [0x7a63ff, 0xe0559c, 0xa088ff, 0x3f9eff] },
  { gen: cerebro, n: 0.1, esc: [0.8, 1.8], rug: 0.9, sway: 0, shadow: false, plano: false, paleta: [0x4fc9f5, 0x6fd6ae, 0xd88ab8, 0xc2dd8a] },
  { gen: lechuga, n: 0.05, esc: [0.5, 0.95], rug: 0.66, sway: 0.012, shadow: false, plano: true, paleta: [0xf0954a, 0xe0703f, 0xf5b96c, 0xe85c8a] },
  { gen: abanico, n: 0.1, esc: [1.3, 3.0], rug: 0.64, sway: 0.03, shadow: false, plano: false, paleta: [0xf2497f, 0xc42a68, 0xff8ab0, 0xa53fd0] },
  { gen: anemona, n: 0.09, esc: [1.0, 2.3], rug: 0.54, sway: 0.036, shadow: false, plano: false, paleta: [0xc9edfa, 0x8fdcf5, 0xf5c2df, 0xa8ecc8] },
  { gen: erizo, n: 0.07, esc: [0.6, 1.4], rug: 0.6, sway: 0.008, shadow: false, plano: false, paleta: [0x6a4af5, 0x3c2ec0, 0x8a63ff, 0x2f5fd8] },
  { gen: esponja, n: 0.09, esc: [0.9, 2.2], rug: 0.82, sway: 0.01, shadow: true, plano: false, paleta: [0xf07f3f, 0xd05534, 0xf5a366, 0xcc4485] },
  { gen: alga, n: 0.07, esc: [1.0, 2.4], rug: 0.7, sway: 0.055, shadow: false, plano: true, paleta: [0x239c78, 0x3fbf8c, 0x17806e, 0x62b850] },
]

function alturaArena(x: number, z: number) {
  let h = fbm(x * 0.03 + 40, z * 0.03 + 40, 4) * 4.6 - 2.3
  h += fbm(x * 0.28 + 7, z * 0.28 + 7, 3) * 0.42
  h += Math.sin(x * 1.25 + fbm(x * 0.07, z * 0.07) * 7) * 0.09
  h -= Math.exp(-(x * x) / (2 * 7.4 * 7.4)) * 3.4
  return h
}

function acuatizar(material: THREE.MeshStandardMaterial, uTime: { value: number }, { sway = 0, caust = 0.45 } = {}) {
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime
    sh.uniforms.uCaustColor = { value: new THREE.Color(0x9fefff) }
    sh.uniforms.uCaustAmt = { value: caust }
    sh.uniforms.uSway = { value: sway }

    sh.vertexShader = 'uniform float uTime;uniform float uSway;varying vec3 vWPos;\n' + sh.vertexShader
    sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `
      #include <begin_vertex>
      if (uSway > 0.0) {
        float h = max(transformed.y, 0.0);
        float k = h * h * uSway;
        transformed.x += sin(uTime * 0.72 + transformed.z * 0.55 + transformed.y * 0.3) * k;
        transformed.z += cos(uTime * 0.58 + transformed.x * 0.5) * k * 0.8;
      }
      #ifdef USE_INSTANCING
        vWPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
      #else
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      #endif
    `)

    const GLSL_CAUSTIC = `
      float caustic(vec2 uv, float t){
        vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
        vec2 i = p; float c = 1.0; const float inten = 0.0045;
        for (int n = 0; n < 5; n++){
          float tt = t * (1.0 - (3.5 / float(n + 1)));
          i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
        }
        c /= 5.0; c = 1.17 - pow(c, 1.4);
        return clamp(pow(abs(c), 8.0), 0.0, 1.8);
      }
    `
    sh.fragmentShader = 'uniform float uTime;uniform vec3 uCaustColor;uniform float uCaustAmt;varying vec3 vWPos;\n' + GLSL_CAUSTIC + '\n' + sh.fragmentShader
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `
      #include <dithering_fragment>
      float cs = caustic(vWPos.xz * 0.048, uTime * 0.26);
      float haz = smoothstep(-10.0, 5.0, vWPos.y);
      gl_FragColor.rgb += uCaustColor * cs * uCaustAmt * (0.30 + haz * 0.80);
      float d = length(vWPos - cameraPosition);
      gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * vec3(0.30, 0.90, 1.18), clamp(d / 78.0, 0.0, 0.88));
    `)
  }
  material.customProgramCacheKey = () => 'aq' + sway + '_' + caust
  return material
}

function CoralInstances({ geometry, material, data }: { geometry: THREE.BufferGeometry; material: THREE.Material; data: { matrix: THREE.Matrix4; color: THREE.Color }[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!meshRef.current) return
    data.forEach((d, i) => {
      meshRef.current!.setMatrixAt(i, d.matrix)
      meshRef.current!.setColorAt(i, d.color)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [data])
  return <instancedMesh ref={meshRef} args={[geometry, material, data.length]} castShadow receiveShadow frustumCulled={false} />
}

export function ReefBuilder({ seed = 20260727, quality }: ReefBuilderProps) {
  const groupRef = useRef<THREE.Group>(null)
  const uTime = useRef({ value: 0 })

  const rng = useMemo(() => new Rng(seed), [seed])

  const macizos = useMemo(() => {
    const arr: { x: number; z: number; r: number }[] = []
    for (let i = 0; i < 36; i++) {
      const lado = rng.next() < 0.5 ? -1 : 1
      arr.push({ x: lado * (3.6 + Math.pow(rng.next(), 0.75) * 19), z: rng.range(-92, 58), r: rng.range(2.6, 7) })
    }
    return arr
  }, [rng])

  function posicionCoral() {
    if (rng.next() < 0.86) {
      const c = macizos[Math.floor(rng.next() * macizos.length)]
      const a = rng.next() * Math.PI * 2
      const d = Math.sqrt(rng.next()) * c.r
      return { x: c.x + Math.cos(a) * d, z: c.z + Math.sin(a) * d }
    }
    const lado = rng.next() < 0.5 ? -1 : 1
    return { x: lado * (3.2 + Math.pow(rng.next(), 0.6) * 25), z: rng.range(-94, 60) }
  }

  const densityMult = quality === 'low' ? 0.35 : quality === 'medium' ? 0.65 : 1
  const totalCorales = Math.floor(660 * densityMult)

  const instances = useMemo(() => {
    const result: { geometry: THREE.BufferGeometry; material: THREE.Material; data: { matrix: THREE.Matrix4; color: THREE.Color }[] }[] = []
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()

    SPECIES.forEach((esp) => {
      const total = Math.max(4, Math.round(totalCorales * esp.n))
      const VAR = quality === 'low' ? 1 : 2
      const porVar = Math.ceil(total / VAR)
      for (let v = 0; v < VAR; v++) {
        const geo = esp.gen(rng)
        const mat = acuatizar(
          new THREE.MeshStandardMaterial({ roughness: esp.rug, metalness: 0.04, side: esp.plano ? THREE.DoubleSide : THREE.FrontSide }),
          uTime.current,
          { sway: esp.sway, caust: 0.26 }
        )
        const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = []
        for (let i = 0; i < porVar; i++) {
          const { x, z } = posicionCoral()
          const y = alturaArena(x, z) - 0.16
          const s = rng.range(esp.esc[0], esp.esc[1])
          dummy.position.set(x, y, z)
          dummy.rotation.set(rng.range(-0.13, 0.13), rng.next() * Math.PI * 2, rng.range(-0.13, 0.13))
          dummy.scale.set(s * rng.range(0.85, 1.15), s * rng.range(0.85, 1.3), s * rng.range(0.85, 1.15))
          dummy.updateMatrix()
          col.setHex(esp.paleta[Math.floor(rng.next() * esp.paleta.length)]).offsetHSL(rng.range(-0.03, 0.03), rng.range(-0.02, 0.12), rng.range(-0.09, 0.04))
          data.push({ matrix: dummy.matrix.clone(), color: col.clone() })
        }
        result.push({ geometry: geo, material: mat, data })
      }
    })
    return result
  }, [rng, totalCorales, quality])

  useFrame((state) => {
    uTime.current.value = state.clock.elapsedTime
  })

  return (
    <group ref={groupRef}>
      {instances.map((inst, idx) => (
        <CoralInstances key={idx} geometry={inst.geometry} material={inst.material} data={inst.data} />
      ))}
    </group>
  )
}
