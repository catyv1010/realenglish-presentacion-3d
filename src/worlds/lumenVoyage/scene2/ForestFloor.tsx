import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Rng, fbm } from '../procedural/math'
import type { QualityLevel } from '../../../types/presentation'

interface ForestFloorProps {
  quality: QualityLevel
}

function displacedPlane(size: number, segments: number) {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments)
  geo.rotateX(-Math.PI / 2)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = p.getZ(i)
    const y = fbm(x * 0.04 + 100, z * 0.04 + 100, 4) * 1.6 + fbm(x * 0.18 + 20, z * 0.18 + 20, 3) * 0.35
    p.setY(i, y)
  }
  geo.computeVertexNormals()
  return geo
}

function rockGeometry(rng: Rng) {
  const geo = new THREE.TetrahedronGeometry(rng.range(0.3, 0.9), 1)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const n = fbm(x * 3 + rng.next() * 10, z * 3 + rng.next() * 10, 2)
    const s = 1 + (n - 0.5) * 0.5
    p.setXYZ(i, x * s, y * rng.range(0.6, 1.1), z * s)
  }
  geo.computeVertexNormals()
  return geo
}

export function ForestFloor({ quality }: ForestFloorProps) {
  const uTime = useRef({ value: 0 })
  const rng = useMemo(() => new Rng(20260729), [])

  const baseGeo = useMemo(() => displacedPlane(130, 80), [])

  const rocks = useMemo(() => {
    const count = quality === 'low' ? 60 : quality === 'medium' ? 110 : 170
    const geo = rockGeometry(rng)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x1e1b2e,
      roughness: 0.95,
      metalness: 0.02,
      emissive: 0x0f0a1e,
      emissiveIntensity: 0.1,
    })
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = []
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const angle = rng.next() * Math.PI * 2
      const r = 6 + Math.sqrt(rng.next()) * 48
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const h = fbm(x * 0.04 + 100, z * 0.04 + 100, 4) * 1.6 + fbm(x * 0.18 + 20, z * 0.18 + 20, 3) * 0.35
      const s = rng.range(0.8, 2.2)
      dummy.position.set(x, h - s * 0.25, z)
      dummy.rotation.set(rng.range(-0.2, 0.2), rng.next() * Math.PI * 2, rng.range(-0.2, 0.2))
      dummy.scale.set(s, s * rng.range(0.6, 1.0), s)
      dummy.updateMatrix()
      col.setHex(0x1e1b2e).offsetHSL(0, rng.range(-0.05, 0.05), rng.range(-0.08, 0.08))
      data.push({ matrix: dummy.matrix.clone(), color: col.clone() })
    }
    return { geo, mat, data }
  }, [rng, quality])

  const moss = useMemo(() => {
    const count = quality === 'low' ? 80 : quality === 'medium' ? 160 : 260
    const geo = new THREE.CircleGeometry(1, 16)
    geo.rotateX(-Math.PI / 2)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.55,
      roughness: 0.9,
      transparent: true,
      opacity: 0.85,
      toneMapped: false,
    })
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime.current
      sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader
      sh.fragmentShader = 'uniform float uTime;\n' + sh.fragmentShader
      sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `
        #include <dithering_fragment>
        float pulse = sin(uTime * 0.7) * 0.08 + 0.92;
        gl_FragColor.rgb *= pulse;
        gl_FragColor.rgb += gl_FragColor.rgb * 0.25;
      `)
    }
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = []
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const angle = rng.next() * Math.PI * 2
      const r = 5 + Math.sqrt(rng.next()) * 50
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const h = fbm(x * 0.04 + 100, z * 0.04 + 100, 4) * 1.6 + fbm(x * 0.18 + 20, z * 0.18 + 20, 3) * 0.35
      const s = rng.range(0.3, 1.2)
      dummy.position.set(x, h + 0.02, z)
      dummy.rotation.set(-Math.PI / 2, rng.next() * Math.PI * 2, 0)
      dummy.scale.set(s, s, s * rng.range(0.7, 1.3))
      dummy.updateMatrix()
      const palette = [0x10b981, 0x34d399, 0x22c55e, 0xa855f7, 0xd946ef]
      col.setHex(palette[Math.floor(rng.next() * palette.length)]).offsetHSL(rng.range(-0.06, 0.06), rng.range(-0.1, 0.1), rng.range(-0.1, 0.15))
      data.push({ matrix: dummy.matrix.clone(), color: col.clone() })
    }
    return { geo, mat, data }
  }, [rng, quality])

  const rockRef = useRef<THREE.InstancedMesh>(null)
  const mossRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!rockRef.current) return
    rocks.data.forEach((d, i) => {
      rockRef.current!.setMatrixAt(i, d.matrix)
      rockRef.current!.setColorAt(i, d.color)
    })
    rockRef.current.instanceMatrix.needsUpdate = true
    if (rockRef.current.instanceColor) rockRef.current.instanceColor.needsUpdate = true
  }, [rocks])

  useLayoutEffect(() => {
    if (!mossRef.current) return
    moss.data.forEach((d, i) => {
      mossRef.current!.setMatrixAt(i, d.matrix)
      mossRef.current!.setColorAt(i, d.color)
    })
    mossRef.current.instanceMatrix.needsUpdate = true
    if (mossRef.current.instanceColor) mossRef.current.instanceColor.needsUpdate = true
  }, [moss])

  useFrame((state) => {
    uTime.current.value = state.clock.elapsedTime
  })

  return (
    <group>
      <mesh geometry={baseGeo} receiveShadow>
        <meshStandardMaterial color="#151026" roughness={0.98} metalness={0.02} emissive="#0a0814" emissiveIntensity={0.08} />
      </mesh>
      <instancedMesh ref={rockRef} args={[rocks.geo, rocks.mat, rocks.data.length]} receiveShadow castShadow />
      <instancedMesh ref={mossRef} args={[moss.geo, moss.mat, moss.data.length]} receiveShadow />
    </group>
  )
}
