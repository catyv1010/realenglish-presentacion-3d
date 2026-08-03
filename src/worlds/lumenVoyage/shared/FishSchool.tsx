import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

interface FishSchoolProps {
  count: number
  palette: string[]
  area: { x: number; z: number; y0: number; y1: number }
  radius: { x: number; z: number }
  speed?: number
}

export function FishSchool({ count, palette, area, radius, speed = 1 }: FishSchoolProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const geometry = useMemo(() => {
    const cuerpo = new THREE.SphereGeometry(0.2, 10, 8)
    cuerpo.scale(0.5, 0.78, 1.7)
    const cola = new THREE.ConeGeometry(0.17, 0.34, 4)
    cola.rotateX(-Math.PI / 2)
    cola.scale(0.32, 1.3, 1)
    cola.translate(0, 0, -0.44)
    const dorsal = new THREE.ConeGeometry(0.1, 0.26, 3)
    dorsal.rotateX(Math.PI / 2)
    dorsal.scale(0.3, 1.2, 1)
    dorsal.translate(0, 0.14, 0)
    return mergeGeometries([cuerpo, cola, dorsal], false)
  }, [])

  const fishData = useMemo(() => {
    return Array.from({ length: count }, () => ({
      rx: radius.x * (0.5 + Math.random()),
      rz: radius.z * (0.5 + Math.random()),
      cx: (Math.random() - 0.5) * 2 * area.x,
      cz: (Math.random() - 0.5) * 2 * area.z,
      cy: area.y0 + Math.random() * (area.y1 - area.y0),
      vel: (0.1 + Math.random() * 0.16) * (Math.random() < 0.5 ? -1 : 1),
      fase: Math.random() * Math.PI * 2,
      amp: 0.5 + Math.random() * 1.5,
      esc: 0.3 + Math.random() * 0.5,
    }))
  }, [count, palette, area, radius])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({ roughness: 0.34, metalness: 0.3 })
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime * speed
    fishData.forEach((f, i) => {
      const a = t * f.vel + f.fase
      const y = f.cy + Math.sin(t * 0.55 + f.fase) * f.amp
      const a2 = a + 0.045 * Math.sign(f.vel)
      dummy.position.set(f.cx + Math.sin(a) * f.rx, y, f.cz + Math.cos(a * 0.83) * f.rz)
      target.set(
        f.cx + Math.sin(a2) * f.rx,
        y + (Math.sin(t * 0.55 + f.fase + 0.05) - Math.sin(t * 0.55 + f.fase)) * f.amp,
        f.cz + Math.cos(a2 * 0.83) * f.rz
      )
      dummy.lookAt(target)
      const coleteo = 1 + Math.sin(t * 7 + f.fase) * 0.09
      dummy.scale.set(f.esc * coleteo, f.esc, f.esc)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  const color = useMemo(() => new THREE.Color(), [])
  useMemo(() => {
    if (!meshRef.current) return
    fishData.forEach((_, i) => {
      color.set(palette[Math.floor(Math.random() * palette.length)])
      meshRef.current!.setColorAt(i, color)
    })
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [fishData, palette])

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} frustumCulled={false}>
      {null}
    </instancedMesh>
  )
}
