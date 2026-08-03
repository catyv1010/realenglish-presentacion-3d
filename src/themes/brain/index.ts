import { BrainEnvironment } from './BrainEnvironment'
import { BrainBuilding } from './BrainBuilding'
import { BrainAtmosphere } from './BrainAtmosphere'
import { BrainInfoDisplay } from './BrainInfoDisplay'
import type { ThemeDefinition } from '../types'

export const brainTheme: ThemeDefinition = {
  id: 'brain',
  name: 'Cerebro Realista',
  description: 'Cerebro humano realista en 3D con regiones brillantes, anillos de datos y partículas neuronales.',
  Environment: BrainEnvironment,
  Building: BrainBuilding,
  Atmosphere: BrainAtmosphere,
  InfoDisplay: BrainInfoDisplay,
}
