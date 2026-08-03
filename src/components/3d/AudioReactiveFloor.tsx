import { useRef } from 'react'
import { Grid } from '@react-three/drei'
import { useAudioStore } from '../../store/useAudioStore'

export function AudioReactiveFloor() {
  const gridRef = useRef(null)
  const average = useAudioStore((state) => state.analysis.average)

  const pulseColor = `hsl(${180 + average * 30}, 80%, ${30 + average * 15}%)`

  return (
    <Grid
      ref={gridRef}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      args={[100, 100]}
      cellSize={1}
      cellThickness={0.3 + average * 0.2}
      cellColor={pulseColor}
      sectionSize={5}
      sectionThickness={0.6 + average * 0.3}
      sectionColor={pulseColor}
      fadeDistance={60}
      fadeStrength={2}
      infiniteGrid
    />
  )
}
