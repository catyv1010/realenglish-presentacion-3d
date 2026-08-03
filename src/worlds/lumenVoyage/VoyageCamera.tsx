import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import type { Scene } from '../../types/presentation'

interface VoyageCameraProps {
  scene: Scene
}

export function VoyageCamera({ scene }: VoyageCameraProps) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3(...scene.cameraTarget))
  const currentPosRef = useRef(new THREE.Vector3(...scene.cameraPosition))

  useEffect(() => {
    const duration = 1.8
    gsap.to(currentPosRef.current, {
      x: scene.cameraPosition[0],
      y: scene.cameraPosition[1],
      z: scene.cameraPosition[2],
      duration,
      ease: 'power2.inOut',
    })
    gsap.to(targetRef.current, {
      x: scene.cameraTarget[0],
      y: scene.cameraTarget[1],
      z: scene.cameraTarget[2],
      duration,
      ease: 'power2.inOut',
    })
  }, [scene.cameraPosition, scene.cameraTarget])

  useFrame(() => {
    camera.position.lerp(currentPosRef.current, 0.05)
    camera.lookAt(targetRef.current)
  })

  return null
}
