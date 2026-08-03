import { MindEnvironment } from './MindEnvironment'
import { MindBuilding } from './MindBuilding'
import { MindAtmosphere } from './MindAtmosphere'
import { MindInfoDisplay } from './MindInfoDisplay'
import type { ThemeDefinition } from '../types'

export const mindTheme: ThemeDefinition = {
  id: 'mind',
  name: 'Mente Neural Holográfica',
  description: 'Mundo cerebral orgánico con regiones neuronales, sinapsis luminosas y pulso de datos.',
  Environment: MindEnvironment,
  Building: MindBuilding,
  Atmosphere: MindAtmosphere,
  InfoDisplay: MindInfoDisplay,
}
