import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

interface CinematicCameraProps {
  enabled: boolean
}

export function CinematicCamera({ enabled }: CinematicCameraProps) {
  const controls = useThree((state) => state.controls)

  useEffect(() => {
    if (controls && 'enabled' in controls) {
      const orbitControls = controls as unknown as {
        enabled: boolean
        update: () => void
      }
      orbitControls.enabled = !enabled
      orbitControls.update()
    }
  }, [enabled, controls])

  return null
}
