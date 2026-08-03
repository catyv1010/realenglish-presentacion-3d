import { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'

interface ImageBillboardProps {
  src: string
  position?: [number, number, number]
  size?: [number, number]
  lookAtCamera?: boolean
  entranceDelay?: number
}

export function ImageBillboard({
  src,
  position = [0, 0, 0],
  size = [3, 2],
  lookAtCamera = true,
  entranceDelay = 0,
}: ImageBillboardProps) {
  const groupRef = useRef<THREE.Group>(null)
  const texture = useTexture(src)
  texture.colorSpace = THREE.SRGBColorSpace

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.8,
        delay: entranceDelay,
        ease: 'back.out(1.7)',
      }
    )
  }, [entranceDelay])

  useFrame((state) => {
    if (!groupRef.current || !lookAtCamera) return
    groupRef.current.lookAt(state.camera.position)
  })

  const [w, h] = size

  return (
    <group ref={groupRef} position={position}>
      <Billboard>
        <mesh>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        {/* Neon border */}
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(w + 0.1, h + 0.1)]} />
          <lineBasicMaterial color="#06b6d4" linewidth={2} />
        </lineSegments>
      </Billboard>
    </group>
  )
}
