import { Sparkles } from '@react-three/drei'

interface AmbientParticlesProps {
  count?: number
}

export function AmbientParticles({ count = 80 }: AmbientParticlesProps) {
  return (
    <Sparkles
      count={count}
      scale={[60, 40, 60]}
      size={2}
      speed={0.4}
      color="#a5b4fc"
    />
  )
}
