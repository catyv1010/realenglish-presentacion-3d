import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface DataStreamProps {
  points: [number, number, number][]
  color: string
  particleColor: string
  speed?: number
  particleCount?: number
  tubeOpacity?: number
}

export function DataStream({ points, color, particleColor, speed = 0.08, particleCount = 40, tubeOpacity = 0.15 }: DataStreamProps) {
  const tubeRef = useRef<THREE.Mesh>(null)
  const instancedRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  }, [points])

  const particleData = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      t: i / particleCount,
      offset: Math.random() * 0.1,
      speedVar: 0.7 + Math.random() * 0.6,
    }))
  }, [particleCount])

  useFrame((state) => {
    if (!tubeRef.current || !instancedRef.current) return

    const time = state.clock.elapsedTime
    const material = tubeRef.current.material as THREE.MeshBasicMaterial
    if (material.map) {
      material.map.offset.x = -time * speed
    }

    particleData.forEach((p) => {
      const progress = (time * speed * p.speedVar + p.t) % 1
      const pos = curve.getPointAt(progress)
      dummy.position.copy(pos)
      const tangent = curve.getTangentAt(progress)
      dummy.lookAt(pos.clone().add(tangent))
      dummy.scale.setScalar(0.08 + Math.sin(time * 5 + progress * 10) * 0.03)
      dummy.updateMatrix()
      instancedRef.current!.setMatrixAt(p.t * particleCount, dummy.matrix)
    })
    instancedRef.current.instanceMatrix.needsUpdate = true
  })

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 1
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 256, 0)
    gradient.addColorStop(0, color + '00')
    gradient.addColorStop(0.5, color + 'ff')
    gradient.addColorStop(1, color + '00')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 1)
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(10, 1)
    return tex
  }, [color])

  return (
    <group>
      <mesh ref={tubeRef}>
        <tubeGeometry args={[curve, 64, 0.12, 8, false]} />
        <meshBasicMaterial color={color} transparent opacity={tubeOpacity} map={texture} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <instancedMesh ref={instancedRef} args={[undefined, undefined, particleCount]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={particleColor} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </instancedMesh>
    </group>
  )
}
