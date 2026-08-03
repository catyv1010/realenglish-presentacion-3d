import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface CameraShakeProps {
  intensity?: number
  duration?: number
}

export function CameraShake({ intensity = 0.3, duration = 0.5 }: CameraShakeProps) {
  const camera = useThree((state) => state.camera)
  const originalPosition = useRef(new THREE.Vector3())
  const isShaking = useRef(true)

  useEffect(() => {
    originalPosition.current.copy(camera.position)

    const timeoutId = window.setTimeout(() => {
      isShaking.current = false
      camera.position.copy(originalPosition.current)
    }, duration * 1000)

    return () => window.clearTimeout(timeoutId)
  }, [camera, duration])

  useFrame(() => {
    if (!isShaking.current) return

    const shakeX = (Math.random() - 0.5) * intensity
    const shakeY = (Math.random() - 0.5) * intensity
    const shakeZ = (Math.random() - 0.5) * intensity

    camera.position.set(
      originalPosition.current.x + shakeX,
      originalPosition.current.y + shakeY,
      originalPosition.current.z + shakeZ
    )
  })

  return null
}
