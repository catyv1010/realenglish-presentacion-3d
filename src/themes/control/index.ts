import { ControlEnvironment } from './ControlEnvironment'
import { ControlBuilding } from './ControlBuilding'
import { ControlAtmosphere } from './ControlAtmosphere'
import type { ThemeDefinition } from '../types'

export const controlTheme: ThemeDefinition = {
  id: 'control',
  name: 'Sala de Control',
  description: 'Centro de mando con radar, telemetría y torres de monitoreo con métricas en vivo.',
  Environment: ControlEnvironment,
  Building: ControlBuilding,
  Atmosphere: ControlAtmosphere,
}
