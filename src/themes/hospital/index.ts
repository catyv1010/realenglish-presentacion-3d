import { HospitalEnvironment } from './HospitalEnvironment'
import { HospitalBuilding } from './HospitalBuilding'
import { HospitalAtmosphere } from './HospitalAtmosphere'
import type { ThemeDefinition } from '../types'

export const hospitalTheme: ThemeDefinition = {
  id: 'hospital',
  name: 'Ciudad Médica',
  description: 'Ciudad hospitalaria nocturna con torres clínicas, cruces de emergencia y luces de ambulancia.',
  Environment: HospitalEnvironment,
  Building: HospitalBuilding,
  Atmosphere: HospitalAtmosphere,
}
