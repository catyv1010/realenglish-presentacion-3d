import { CanopyEnvironment } from './CanopyEnvironment'
import { CanopyBuilding } from './CanopyBuilding'
import { CanopyAtmosphere } from './CanopyAtmosphere'
import type { ThemeDefinition } from '../types'

export const canopyTheme: ThemeDefinition = {
  id: 'canopy',
  name: 'Canopy del Bosque Nuboso',
  description:
    'Recorrido nocturno en canopy por un bosque nuboso costarricense: ceibas gigantes, estaciones de madera con faroles, cables de tirolesa, neblina y luciérnagas.',
  Environment: CanopyEnvironment,
  Building: CanopyBuilding,
  Atmosphere: CanopyAtmosphere,
}
