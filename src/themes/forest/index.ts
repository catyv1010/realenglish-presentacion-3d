import { ForestEnvironment } from './ForestEnvironment'
import { ForestBuilding } from './ForestBuilding'
import { ForestAtmosphere } from './ForestAtmosphere'
import { ForestInfoDisplay } from './ForestInfoDisplay'
import type { ThemeDefinition } from '../types'

export const forestTheme: ThemeDefinition = {
  id: 'forest',
  name: 'Bosque Bioluminiscente',
  description: 'Bosque mágico con árboles de cristal, luciérnagas, polen brillante y cristales que crecen desde el suelo.',
  Environment: ForestEnvironment,
  Building: ForestBuilding,
  Atmosphere: ForestAtmosphere,
  InfoDisplay: ForestInfoDisplay,
}
