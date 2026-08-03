import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeEnvironmentProps } from '../types'
import { ForestFloor } from './ForestFloor'

function twistedTrunkGeometry() {
  const geo = new THREE.CylinderGeometry(0.2, 0.8, 10, 10, 16)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const t = (y + 5) / 10
    const twist = Math.sin(t * Math.PI * 2) * 0.4
    p.setX(i, x + twist)
    p.setZ(i, z + Math.cos(t * Math.PI * 2) * 0.3)
  }
  geo.computeVertexNormals()
  return geo
}

function crownGeometry() {
  const geo = new THREE.IcosahedronGeometry(1, 1)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const n = Math.sin(x * 3 + y * 2 + z * 2)
    const s = 1 + n * 0.2
    p.setXYZ(i, x * s, y * s, z * s)
  }
  geo.computeVertexNormals()
  return geo
}

function ringGeometry() {
  return new THREE.TorusGeometry(1, 0.04, 6, 32)
}

export function ForestEnvironment({ scene, quality }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.035
    scene3d.background = new THREE.Color('#020a08')
    scene3d.fog = new THREE.FogExp2('#020a08', fogDensity)
  }, [config?.fogDensity, scene3d])

  const treeCount = quality === 'high' ? 45 : quality === 'medium' ? 32 : 20

  const trunkGeo = useMemo(() => twistedTrunkGeometry(), [])
  const crownGeo = useMemo(() => crownGeometry(), [])
  const ringGeo = useMemo(() => ringGeometry(), [])

  const trunkMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x10b981,
      emissiveIntensity: 0.25,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.45,
      transparent: true,
      opacity: 0.8,
      clearcoat: 1,
      toneMapped: false,
    })
  }, [])

  const crownMat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x8b5cf6,
      emissiveIntensity: 0.55,
      roughness: 0.1,
      metalness: 0.05,
      transmission: 0.35,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1,
      toneMapped: false,
    })
  }, [])

  const ringMat = useMemo(() => {
    return new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
  }, [])

  const trees = useMemo(() => {
    const data: { matrix: THREE.Matrix4; color: THREE.Color; height: number }[] = []
    const dummy = new THREE.Object3D()
    const col = new THREE.Color()
    const palette = [0x10b981, 0x06b6d4, 0x8b5cf6, 0xec4899, 0x5eead4]
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + Math.random() * 0.5
      const radius = 14 + Math.random() * 28 + (i % 3) * 5
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const height = 12 + Math.random() * 14
      const s = 0.7 + Math.random() * 0.6
      dummy.position.set(x, 0, z)
      dummy.rotation.set(0, Math.random() * Math.PI * 2, 0)
      dummy.scale.set(s, height / 10 * s, s)
      dummy.updateMatrix()
      col.setHex(palette[i % palette.length]).offsetHSL(Math.random() * 0.08 - 0.04, Math.random() * 0.1 - 0.05, Math.random() * 0.1 - 0.05)
      data.push({ matrix: dummy.matrix.clone(), color: col.clone(), height })
    }
    return data
  }, [treeCount])

  const trunks = useMemo(() => trees.map(t => ({ matrix: t.matrix, color: t.color })), [trees])
  const crowns = useMemo(() => {
    const dummy = new THREE.Object3D()
    return trees.map(t => {
      dummy.position.set(t.matrix.elements[12], t.height * 0.95, t.matrix.elements[14])
      const s = 0.8 + Math.random() * 0.7
      dummy.scale.set(s, s, s)
      dummy.rotation.set(Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.3)
      dummy.updateMatrix()
      return { matrix: dummy.matrix.clone(), color: t.color }
    })
  }, [trees])
  const rings = useMemo(() => {
    const dummy = new THREE.Object3D()
    return trees.flatMap(t => {
      const result: { matrix: THREE.Matrix4; color: THREE.Color }[] = []
      for (let j = 0; j < 3; j++) {
        dummy.position.set(t.matrix.elements[12], t.height * (0.4 + j * 0.25), t.matrix.elements[14])
        dummy.rotation.set(Math.PI / 2, Math.random() * Math.PI, 0)
        const s = 0.6 + j * 0.25
        dummy.scale.set(s, s, s)
        dummy.updateMatrix()
        result.push({ matrix: dummy.matrix.clone(), color: t.color })
      }
      return result
    })
  }, [trees])

  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const crownRef = useRef<THREE.InstancedMesh>(null)
  const ringRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!trunkRef.current) return
    trunks.forEach((d, i) => {
      trunkRef.current!.setMatrixAt(i, d.matrix)
      trunkRef.current!.setColorAt(i, d.color)
    })
    trunkRef.current.instanceMatrix.needsUpdate = true
    if (trunkRef.current.instanceColor) trunkRef.current.instanceColor.needsUpdate = true
  }, [trunks])

  useLayoutEffect(() => {
    if (!crownRef.current) return
    crowns.forEach((d, i) => {
      crownRef.current!.setMatrixAt(i, d.matrix)
      crownRef.current!.setColorAt(i, d.color)
    })
    crownRef.current.instanceMatrix.needsUpdate = true
    if (crownRef.current.instanceColor) crownRef.current.instanceColor.needsUpdate = true
  }, [crowns])

  useLayoutEffect(() => {
    if (!ringRef.current) return
    rings.forEach((d, i) => {
      ringRef.current!.setMatrixAt(i, d.matrix)
      ringRef.current!.setColorAt(i, d.color)
    })
    ringRef.current.instanceMatrix.needsUpdate = true
    if (ringRef.current.instanceColor) ringRef.current.instanceColor.needsUpdate = true
  }, [rings])

  useFrame((state) => {
    if (!ringRef.current) return
    ringRef.current.rotation.y = state.clock.elapsedTime * 0.02
  })

  return (
    <>
      <ambientLight intensity={0.12} color="#064e3b" />
      <directionalLight position={[12, 25, 8]} intensity={0.55} color="#34d399" castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 10, 0]} intensity={1.4} color="#10b981" distance={80} decay={2} />
      <pointLight position={[-20, 5, -15]} intensity={0.9} color="#8b5cf6" distance={60} decay={2} />
      <pointLight position={[20, 5, -15]} intensity={0.9} color="#06b6d4" distance={60} decay={2} />
      <pointLight position={[0, 3, 20]} intensity={0.7} color="#ec4899" distance={50} decay={2} />

      <ForestFloor quality={quality} />

      <instancedMesh ref={trunkRef} args={[trunkGeo, trunkMat, trunks.length]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={crownRef} args={[crownGeo, crownMat, crowns.length]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={ringRef} args={[ringGeo, ringMat, rings.length]} frustumCulled={false} />
    </>
  )
}
