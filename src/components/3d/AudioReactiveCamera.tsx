import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioStore } from '../../store/useAudioStore'

export function AudioReactiveCamera() {
  const camera = useThree((state) => state.camera)
  const basePosition = useRef(new THREE.Vector3())
  const bass = useAudioStore((state) => state.analysis.bass)

  useEffect(() => {
    basePosition.current.copy(camera.position)
  }, [camera])

  useFrame(() => {
    const pulse = bass * 0.15
    camera.position.x = basePosition.current.x + Math.sin(Date.now() * 0.003) * pulse
    camera.position.y = basePosition.current.y + Math.cos(Date.now() * 0.004) * pulse * 0.5
  })

  return null
}
