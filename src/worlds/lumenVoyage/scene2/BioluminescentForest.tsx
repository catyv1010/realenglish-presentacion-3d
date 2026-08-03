import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { Rng, fbm, v3 } from '../procedural/math'
import { tube } from '../procedural/geometry'
import type { QualityLevel } from '../../../types/presentation'

interface BioluminescentForestProps {
  quality: QualityLevel
}

function kelpFrond(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const height = rng.range(7, 14)
  const stemCurve = new THREE.CatmullRomCurve3([
    v3(0, 0, 0),
    v3(rng.range(-0.4, 0.4), height * 0.35, rng.range(-0.4, 0.4)),
    v3(rng.range(-0.8, 0.8), height * 0.65, rng.range(-0.8, 0.8)),
    v3(rng.range(-1.4, 1.4), height, rng.range(-1.4, 1.4)),
  ])
  parts.push(new THREE.TubeGeometry(stemCurve, 18, rng.range(0.05, 0.09), 8, false))
  const leafCount = Math.floor(rng.range(8, 16))
  for (let i = 0; i < leafCount; i++) {
    const t = (i + 1) / (leafCount + 1)
    const pos = stemCurve.getPoint(t)
    const leaf = new THREE.PlaneGeometry(rng.range(0.3, 0.6), rng.range(1.4, 2.6), 5, 10)
    leaf.translate(0, rng.range(0.6, 1.3), 0)
    const p = leaf.attributes.position
    for (let j = 0; j < p.count; j++) {
      const lx = p.getX(j), ly = p.getY(j)
      p.setZ(j, Math.sin(ly * 3 + t * 5) * 0.14 * ly + rng.range(-0.06, 0.06))
      p.setX(j, lx * (1 - ly * 0.3))
    }
    leaf.computeVertexNormals()
    const side = rng.next() < 0.5 ? 1 : -1
    leaf.rotateZ(side * rng.range(0.35, 0.9))
    leaf.rotateY(rng.next() * Math.PI * 2)
    leaf.translate(pos.x, pos.y, pos.z)
    parts.push(leaf)
  }
  return mergeGeometries(parts, false)
}

function glowAnemone(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const base = new THREE.SphereGeometry(0.35, 14, 10)
  base.scale(1, 0.55, 1)
  base.translate(0, 0.14, 0)
  parts.push(base)
  const n = 32
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rng.range(-0.08, 0.08)
    const rad = rng.range(0.12, 0.45)
    const alto = rng.range(0.9, 2.1)
    const curva = new THREE.CatmullRomCurve3([
      v3(Math.cos(a) * rad * 0.3, 0.15, Math.sin(a) * rad * 0.3),
      v3(Math.cos(a) * rad * 1.0, alto * 0.45, Math.sin(a) * rad * 1.0),
      v3(Math.cos(a) * rad * 2.0, alto * 0.85, Math.sin(a) * rad * 2.0),
      v3(Math.cos(a) * rad * 2.8, alto, Math.sin(a) * rad * 2.8),
    ])
    parts.push(new THREE.TubeGeometry(curva, 7, rng.range(0.025, 0.04), 5, false))
  }
  return mergeGeometries(parts, false)
}

function glowMushroom(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const h = rng.range(0.7, 1.4)
  parts.push(tube(v3(0, 0, 0), v3(rng.range(-0.06, 0.06), h, rng.range(-0.06, 0.06)), 0.14, 0.1, 8))
  const cap = new THREE.SphereGeometry(rng.range(0.55, 1.0), 24, 16, 0, Math.PI * 2, 0, Math.PI / 2)
  cap.translate(0, h, 0)
  const p = cap.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i)
    const d = Math.hypot(x, z)
    p.setY(i, p.getY(i) + Math.sin(d * 8) * 0.04)
  }
  cap.computeVertexNormals()
  parts.push(cap)
  return mergeGeometries(parts, false)
}

function energyOrb(_rng: Rng) {
  const g = new THREE.IcosahedronGeometry(0.32, 2)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const n = fbm(p.getX(i) * 2 + 5, p.getY(i) * 2 + 5, 3)
    const s = 1 + (n - 0.5) * 0.35
    p.setXYZ(i, p.getX(i) * s, p.getY(i) * s, p.getZ(i) * s)
  }
  g.computeVertexNormals()
  return g
}

function hangingRoot(rng: Rng) {
  const parts: THREE.BufferGeometry[] = []
  const length = rng.range(4, 10)
  const curve = new THREE.CatmullRomCurve3([
    v3(rng.range(-0.3, 0.3), length, rng.range(-0.3, 0.3)),
    v3(rng.range(-0.6, 0.6), length * 0.7, rng.range(-0.6, 0.6)),
    v3(rng.range(-1.0, 1.0), length * 0.35, rng.range(-1.0, 1.0)),
    v3(rng.range(-1.5, 1.5), 0, rng.range(-1.5, 1.5)),
  ])
  parts.push(new THREE.TubeGeometry(curve, 16, rng.range(0.04, 0.08), 6, false))
  const nodules = Math.floor(rng.range(3, 7))
  for (let i = 0; i < nodules; i++) {
    const t = (i + 1) / (nodules + 1)
    const pos = curve.getPoint(t)
    const nodule = new THREE.SphereGeometry(rng.range(0.1, 0.2), 8, 6)
    nodule.translate(pos.x, pos.y, pos.z)
    parts.push(nodule)
  }
  return mergeGeometries(parts, false)
}

interface SpeciesDef {
  gen: (rng: Rng) => THREE.BufferGeometry
  n: number
  esc: [number, number]
  rug: number
  sway: number
  plano: boolean
  emissive: number
  emissiveIntensity: number
  paleta: number[]
  yOffset: number | ((rng: Rng) => number)
}

const SPECIES: SpeciesDef[] = [
  { gen: kelpFrond, n: 0.34, esc: [1.0, 2.0], rug: 0.6, sway: 0.06, plano: true, emissive: 0x064e3b, emissiveIntensity: 0.55, paleta: [0x10b981, 0x059669, 0x34d399, 0x22c55e], yOffset: 0 },
  { gen: glowAnemone, n: 0.20, esc: [0.85, 1.8], rug: 0.4, sway: 0.065, plano: false, emissive: 0x4c1d95, emissiveIntensity: 0.75, paleta: [0x8b5cf6, 0xd946ef, 0x0ea5e9, 0xf472b6], yOffset: 0 },
  { gen: glowMushroom, n: 0.16, esc: [0.75, 1.55], rug: 0.5, sway: 0.015, plano: false, emissive: 0x701a75, emissiveIntensity: 0.65, paleta: [0xa855f7, 0xec4899, 0x6366f1, 0x14b8a6], yOffset: 0 },
  { gen: energyOrb, n: 0.12, esc: [0.6, 1.3], rug: 0.2, sway: 0.02, plano: false, emissive: 0xffffff, emissiveIntensity: 1.2, paleta: [0xffffff, 0x5eead4, 0xc084fc, 0x67e8f9], yOffset: rng => rng.range(1.5, 6) },
  { gen: hangingRoot, n: 0.18, esc: [1.0, 1.7], rug: 0.7, sway: 0.035, plano: false, emissive: 0x1e293b, emissiveIntensity: 0.35, paleta: [0x475569, 0x64748b, 0x334155, 0x94a3b8], yOffset: rng => -rng.next() * 0.3 },
]

function ForestInstances({ geometry, material, data, castShadow }: { geometry: THREE.BufferGeometry; material: THREE.Material; data: { matrix: THREE.Matrix4; color: THREE.Color }[]; castShadow?: boolean }) {
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
  return <instancedMesh ref={meshRef} args={[geometry, material, data.length]} castShadow={castShadow} receiveShadow frustumCulled={false} />
}

export function BioluminescentForest({ quality }: BioluminescentForestProps) {
  const uTime = useRef({ value: 0 })
  const rng = useMemo(() => new Rng(20260728), [])
  const count = quality === 'low' ? 180 : quality === 'medium' ? 320 : 520

  const instances = useMemo(() => {
    const result: { geometry: THREE.BufferGeometry; material: THREE.Material; data: { matrix: THREE.Matrix4; color: THREE.Color }[]; castShadow: boolean }[] = []
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    SPECIES.forEach((esp) => {
      const total = Math.max(4, Math.round(count * esp.n))
      const VAR = quality === 'low' ? 1 : 2
      const porVar = Math.ceil(total / VAR)
      for (let v = 0; v < VAR; v++) {
        const geo = esp.gen(rng)
        const mat = new THREE.MeshStandardMaterial({
          roughness: esp.rug,
          metalness: 0.05,
          emissive: esp.emissive,
          emissiveIntensity: esp.emissiveIntensity,
          side: esp.plano ? THREE.DoubleSide : THREE.FrontSide,
          toneMapped: esp.emissiveIntensity > 0.8 ? false : undefined,
        })
        mat.onBeforeCompile = (sh) => {
          sh.uniforms.uTime = uTime.current
          sh.vertexShader = 'uniform float uTime;varying float vH;varying vec3 vPos;\n' + sh.vertexShader
          sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `
            #include <begin_vertex>
            vH = position.y;
            vPos = transformed;
            float k = vH * vH * ${esp.sway.toFixed(3)};
            float wave1 = sin(uTime * 0.7 + transformed.x * 0.35 + transformed.z * 0.25);
            float wave2 = sin(uTime * 0.42 + transformed.z * 0.5 - transformed.x * 0.2);
            float wave3 = sin(uTime * 0.55 + transformed.x * 0.15 + transformed.z * 0.35);
            float current = sin(uTime * 0.12) * 0.12;
            transformed.x += (wave1 * 0.55 + wave2 * 0.35 + wave3 * 0.25 + current) * k;
            transformed.z += (wave2 * 0.45 - wave1 * 0.25 + wave3 * 0.2 + current * 0.8) * k;
          `)
          sh.fragmentShader = 'varying float vH;varying vec3 vPos;\n' + sh.fragmentShader
          sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `
            #include <dithering_fragment>
            float hGlow = smoothstep(0.0, 3.0, vH) * 0.55;
            float pulse = sin(vH * 3.5 - uTime * 0.9) * 0.08 * smoothstep(0.0, 2.5, vH);
            float depthGlow = smoothstep(-1.0, 4.0, vPos.y) * 0.2;
            gl_FragColor.rgb += gl_FragColor.rgb * (hGlow + pulse + depthGlow);
          `)
        }
        const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = []
        for (let i = 0; i < porVar; i++) {
          const angle = rng.next() * Math.PI * 2
          const ring = rng.next()
          const r = 4 + Math.pow(ring, 0.65) * 38
          const x = Math.cos(angle) * r
          const z = Math.sin(angle) * r
          const zoneScale = r < 12 ? rng.range(1.25, 1.9) : r < 24 ? rng.range(0.95, 1.45) : rng.range(0.8, 1.15)
          const s = rng.range(esp.esc[0], esp.esc[1]) * zoneScale
          const getYOffset = (y: typeof esp.yOffset, r: Rng): number => (typeof y === 'function' ? y(r) : y)
          const yOff = getYOffset(esp.yOffset, rng)
          dummy.position.set(x, yOff, z)
          dummy.rotation.set(rng.range(-0.12, 0.12), rng.next() * Math.PI * 2, rng.range(-0.12, 0.12))
          dummy.scale.set(s * rng.range(0.9, 1.2), s * rng.range(0.9, 1.3), s * rng.range(0.9, 1.2))
          dummy.updateMatrix()
          col.setHex(esp.paleta[Math.floor(rng.next() * esp.paleta.length)]).offsetHSL(rng.range(-0.05, 0.05), rng.range(-0.1, 0.1), rng.range(-0.1, 0.15))
          data.push({ matrix: dummy.matrix.clone(), color: col.clone() })
        }
        result.push({ geometry: geo, material: mat, data, castShadow: false })
      }
    })
    return result
  }, [rng, count, quality])

  useFrame((state) => {
    uTime.current.value = state.clock.elapsedTime
  })

  return (
    <group>
      {instances.map((inst, idx) => (
        <ForestInstances key={idx} geometry={inst.geometry} material={inst.material} data={inst.data} castShadow={inst.castShadow} />
      ))}
    </group>
  )
}
