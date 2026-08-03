import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAudioStore } from '../../store/useAudioStore'
import type { PointLight } from 'three'

interface AudioReactiveLightProps {
  position: [number, number, number]
  color?: string
  baseIntensity?: number
}

export function AudioReactiveLight({
  position,
  color = '#06b6d4',
  baseIntensity = 0.8,
}: AudioReactiveLightProps) {
  const lightRef = useRef<PointLight>(null)
  const bass = useAudioStore((state) => state.analysis.bass)

  useFrame(() => {
    if (!lightRef.current) return
    const targetIntensity = baseIntensity + bass * 2
    lightRef.current.intensity += (targetIntensity - lightRef.current.intensity) * 0.2
  })

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={baseIntensity}
      distance={50}
    />
  )
}
