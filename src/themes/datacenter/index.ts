import { DatacenterEnvironment } from './DatacenterEnvironment'
import { DatacenterBuilding } from './DatacenterBuilding'
import { DatacenterAtmosphere } from './DatacenterAtmosphere'
import type { ThemeDefinition } from '../types'

export const datacenterTheme: ThemeDefinition = {
  id: 'datacenter',
  name: 'Centro de Respaldo',
  description: 'Centro de datos con racks de servidores, LEDs de actividad y flujo de respaldo hacia la nube.',
  Environment: DatacenterEnvironment,
  Building: DatacenterBuilding,
  Atmosphere: DatacenterAtmosphere,
}
