import { Stars } from '@react-three/drei'

export function StarField() {
  return (
    <Stars
      radius={80}
      depth={50}
      count={1500}
      factor={4}
      saturation={0.2}
      fade
      speed={0.3}
    />
  )
}
