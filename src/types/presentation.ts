export type QualityLevel = 'low' | 'medium' | 'high'

export type NavigationMode = 'manual' | 'auto' | 'free'

export type InteractiveElementType = 'text' | 'image' | 'video' | 'chart' | 'button'

export interface InteractiveElement {
  id: string
  type: InteractiveElementType
  position: [number, number, number]
  content: string
}

export interface BuildingConfig {
  id: string
  label?: string
  /** Variante visual del tema (p. ej. academia: libros | edificio | lapiz | bloques | globo) */
  variant?: string
  position: [number, number, number]
  size: [number, number, number]
  color?: string
  windowColor?: string
  transparent?: boolean
  hasCore?: boolean
  entranceDelay?: number
}

export interface ConnectionConfig {
  from: [number, number, number]
  to: [number, number, number]
  color?: string
  animated?: boolean
  curved?: boolean
  entranceDelay?: number
}

export interface ParticlePathConfig {
  points: [number, number, number][]
  color?: string
  count?: number
  entranceDelay?: number
}

export interface DroneConfig {
  id: string
  path: [number, number, number][]
  color?: string
  speed?: number
  size?: number
}

export interface HologramConfig {
  id: string
  position: [number, number, number]
  size?: [number, number]
  color?: string
  content?: string
  rotationSpeed?: number
}

export interface CameraKeyframe {
  position: [number, number, number]
  target: [number, number, number]
  duration: number
  ease?: string
  hold?: number
}

export type ThemeId =
  | 'cyberpunk'
  | 'neural'
  | 'cosmos'
  | 'hospital'
  | 'vault'
  | 'datacenter'
  | 'control'
  | 'city'
  | 'tables'
  | 'rows-columns'
  | 'primary-key'
  | 'foreign-key'
  | 'join'
  | 'index'
  | 'sql-query'
  | 'full-system'
  | 'museum'
  | 'lumen-city'
  | 'canopy'
  | 'academia'

export interface DataTableConfig {
  id: string
  position: [number, number, number]
  headers?: string[]
  rows?: string[][]
  color?: string
  entranceDelay?: number
}

export interface ImageBillboardConfig {
  id: string
  src: string
  position: [number, number, number]
  size?: [number, number]
  entranceDelay?: number
}

export interface VisualConfig {
  theme?: ThemeId
  buildings?: BuildingConfig[]
  connections?: ConnectionConfig[]
  energyCores?: [number, number, number][]
  particlePaths?: ParticlePathConfig[]
  drones?: DroneConfig[]
  holograms?: HologramConfig[]
  dataTables?: DataTableConfig[]
  imageBillboards?: ImageBillboardConfig[]
  cameraPath?: CameraKeyframe[]
  showGrid?: boolean
  showStars?: boolean
  showShootingStars?: boolean
  showAmbientParticles?: boolean
  reflectiveFloor?: boolean
  fogDensity?: number
  titlePosition?: [number, number, number]
  entranceDuration?: number
  rain?: boolean
  traffic?: boolean
  neonIntensity?: number
  /** Ruta al modelo GLB/GLTF usado por mundos premium (p. ej. museum) */
  model?: string
  /** Color de fondo para la escena (sobrescribe el global) */
  backgroundColor?: string
  /** Color del acento/luces del mundo premium */
  accentColor?: string
  /** Escala relativa del modelo en mundos premium (1 = tamaño por defecto) */
  modelScale?: number
  /** Exposición de tone mapping para esta escena */
  exposure?: number
  /** Mundo claro/diurno: usa post-procesado suave (sin bloom agresivo) */
  lightWorld?: boolean
  /** Si es true, la escena es un mundo explorable tipo videojuego (WASD + mouse) */
  isExplorable?: boolean
}

export interface Scene {
  id: string
  title: string
  content: string
  /** Nombre del mundo mostrado como subtítulo (ej. "Ciudad Médica") */
  world?: string
  /** Puntos detallados que se muestran en el panel lateral */
  bullets?: string[]
  /** Fragmento SQL/código mostrado en el panel lateral (una línea por elemento) */
  code?: string[]
  /** Título opcional del bloque de código */
  codeTitle?: string
  environment: ThemeId
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  interactiveElements: InteractiveElement[]
  visualConfig?: VisualConfig
}

export interface Presentation {
  title: string
  theme: string
  visualStyle: string
  scenes: Scene[]
}
