import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../types/presentation'

interface ForestFloorProps {
  quality: QualityLevel
}

function noise(x: number, z: number) {
  return Math.sin(x * 0.15 + z * 0.1) * Math.cos(x * 0.08 - z * 0.13) * 0.5 +
    Math.sin(x * 0.05 + z * 0.07) * 1.2 +
    Math.cos(x * 0.25 + z * 0.22) * 0.25
}

function createGroundGeometry() {
  const geo = new THREE.PlaneGeometry(180, 180, 90, 90)
  geo.rotateX(-Math.PI / 2)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = p.getZ(i)
    const y = noise(x, z) - 0.5
    p.setY(i, y)
  }
  geo.computeVertexNormals()
  return geo
}

function rockGeometry() {
  const geo = new THREE.DodecahedronGeometry(1, 0)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    p.setXYZ(i, x * (0.8 + Math.random() * 0.4), y * (0.4 + Math.random() * 0.4), z * (0.8 + Math.random() * 0.4))
  }
  geo.computeVertexNormals()
  return geo
}

export function ForestFloor({ quality }: ForestFloorProps) {
  const uTime = useRef({ value: 0 })
  const random = (min = 0, max = 1) => min + Math.random() * (max - min)

  const groundGeo = useMemo(() => createGroundGeometry(), [])

  const rockCount = quality === 'high' ? 140 : quality === 'medium' ? 90 : 50
  const mossCount = quality === 'high' ? 220 : quality === 'medium' ? 140 : 70
  const crystalCount = quality === 'high' ? 90 : quality === 'medium' ? 55 : 30

  const rocks = useMemo(() => {
    const geo = rockGeometry()
    const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.95, metalness: 0.02 })
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = []
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    for (let i = 0; i < rockCount; i++) {
      const angle = random(0, Math.PI * 2)
      const r = random(4, 70)
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = noise(x, z) - 0.5
      const s = random(0.4, 1.6)
      dummy.position.set(x, y + s * 0.2, z)
      dummy.rotation.set(random(-0.2, 0.2), random(0, Math.PI * 2), random(-0.2, 0.2))
      dummy.scale.set(s, s * random(0.5, 0.9), s)
      dummy.updateMatrix()
      col.setHex(0x1e1b2e).offsetHSL(0, random(-0.05, 0.05), random(-0.08, 0.08))
      data.push({ matrix: dummy.matrix.clone(), color: col.clone() })
    }
    return { geo, mat, data }
  }, [rockCount])

  const moss = useMemo(() => {
    const geo = new THREE.CircleGeometry(1, 12)
    geo.rotateX(-Math.PI / 2)
    const mat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.45,
      roughness: 0.9,
      transparent: true,
      opacity: 0.9,
      toneMapped: false,
    })
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = uTime.current
      sh.fragmentShader = 'uniform float uTime;\n' + sh.fragmentShader
      sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `
        #include <dithering_fragment>
        float pulse = sin(uTime * 0.8) * 0.1 + 0.9;
        gl_FragColor.rgb *= pulse;
        gl_FragColor.rgb += gl_FragColor.rgb * 0.2;
      `)
    }
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = []
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    const palette = [0x10b981, 0x34d399, 0x22c55e, 0x14b8a6, 0xa855f7]
    for (let i = 0; i < mossCount; i++) {
      const angle = random(0, Math.PI * 2)
      const r = random(3, 65)
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = noise(x, z) - 0.5
      const s = random(0.3, 1.4)
      dummy.position.set(x, y + 0.03, z)
      dummy.rotation.set(-Math.PI / 2, random(0, Math.PI * 2), 0)
      dummy.scale.set(s, s * random(0.7, 1.3), 1)
      dummy.updateMatrix()
      col.setHex(palette[Math.floor(random(0, palette.length))]).offsetHSL(random(-0.06, 0.06), random(-0.1, 0.1), random(-0.1, 0.15))
      data.push({ matrix: dummy.matrix.clone(), color: col.clone() })
    }
    return { geo, mat, data }
  }, [mossCount])

  const crystals = useMemo(() => {
    const geo = new THREE.ConeGeometry(1, 1, 6)
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x5eead4,
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.3,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1,
      toneMapped: false,
    })
    const data: { matrix: THREE.Matrix4; color: THREE.Color }[] = []
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    const palette = [0x5eead4, 0x8b5cf6, 0xec4899, 0x06b6d4]
    for (let i = 0; i < crystalCount; i++) {
      const angle = random(0, Math.PI * 2)
      const r = random(5, 60)
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = noise(x, z) - 0.5
      const s = random(0.15, 0.5)
      dummy.position.set(x, y + s * 0.5, z)
      dummy.rotation.set(0, random(0, Math.PI * 2), 0)
      dummy.scale.set(s, s * random(1.5, 3), s)
      dummy.updateMatrix()
      col.setHex(palette[Math.floor(random(0, palette.length))]).offsetHSL(random(-0.05, 0.05), random(-0.1, 0.1), random(-0.1, 0.1))
      data.push({ matrix: dummy.matrix.clone(), color: col.clone() })
    }
    return { geo, mat, data }
  }, [crystalCount])

  const rockRef = useRef<THREE.InstancedMesh>(null)
  const mossRef = useRef<THREE.InstancedMesh>(null)
  const crystalRef = useRef<THREE.InstancedMesh>(null)

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

  useLayoutEffect(() => {
    if (!crystalRef.current) return
    crystals.data.forEach((d, i) => {
      crystalRef.current!.setMatrixAt(i, d.matrix)
      crystalRef.current!.setColorAt(i, d.color)
    })
    crystalRef.current.instanceMatrix.needsUpdate = true
    if (crystalRef.current.instanceColor) crystalRef.current.instanceColor.needsUpdate = true
  }, [crystals])

  useFrame((state) => {
    uTime.current.value = state.clock.elapsedTime
  })

  return (
    <group>
      <mesh geometry={groundGeo} receiveShadow>
        <meshStandardMaterial color="#061410" roughness={0.98} metalness={0.02} />
      </mesh>
      <instancedMesh ref={rockRef} args={[rocks.geo, rocks.mat, rocks.data.length]} receiveShadow castShadow />
      <instancedMesh ref={mossRef} args={[moss.geo, moss.mat, moss.data.length]} receiveShadow />
      <instancedMesh ref={crystalRef} args={[crystals.geo, crystals.mat, crystals.data.length]} castShadow />
    </group>
  )
}
