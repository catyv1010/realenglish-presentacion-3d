import type { ReactNode } from 'react'
import type {
  BuildingConfig,
  ConnectionConfig,
  DroneConfig,
  HologramConfig,
  ParticlePathConfig,
  QualityLevel,
  Scene,
} from '../types/presentation'

export interface ThemeContext {
  scene: Scene
  quality: QualityLevel
}

export interface ThemeBuildingProps {
  config: BuildingConfig
  entranceDuration: number
  quality: QualityLevel
}

export interface ThemeEnvironmentProps {
  scene: Scene
  quality: QualityLevel
}

export interface ThemeAtmosphereProps {
  scene: Scene
  quality: QualityLevel
}

export interface ThemeInfoDisplayProps {
  scene: Scene
  quality: QualityLevel
}

export interface ThemeDefinition {
  id: string
  name: string
  description: string
  Environment: (props: ThemeEnvironmentProps) => ReactNode
  Building: (props: ThemeBuildingProps) => ReactNode
  Atmosphere?: (props: ThemeAtmosphereProps) => ReactNode
  InfoDisplay?: (props: ThemeInfoDisplayProps) => ReactNode
}

export interface ConnectionRenderProps {
  config: ConnectionConfig
  entranceDuration: number
  quality: QualityLevel
}

export interface DroneRenderProps {
  config: DroneConfig
  quality: QualityLevel
}

export interface HologramRenderProps {
  config: HologramConfig
  quality: QualityLevel
}

export interface ParticlePathRenderProps {
  config: ParticlePathConfig
  quality: QualityLevel
}

export interface EnergyCoreRenderProps {
  position: [number, number, number]
  quality: QualityLevel
}
