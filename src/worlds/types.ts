import type { ReactNode } from 'react'
import type { QualityLevel, Scene } from '../types/presentation'

export interface WorldProps {
  scene: Scene
  quality: QualityLevel
  entranceDuration: number
}

export interface WorldDefinition {
  id: string
  name: string
  description: string
  World: (props: WorldProps) => ReactNode
}
