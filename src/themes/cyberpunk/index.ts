import { CyberpunkEnvironment } from './CyberpunkEnvironment'
import { CyberpunkBuilding } from './CyberpunkBuilding'
import { CyberpunkAtmosphere } from './CyberpunkAtmosphere'
import { CyberpunkInfoDisplay } from './CyberpunkInfoDisplay'
import type { ThemeDefinition } from '../types'

export const cyberpunkTheme: ThemeDefinition = {
  id: 'cyberpunk',
  name: 'Cyberpunk Metropolis',
  description: 'Ciudad futurista de neón con edificios procedurales, lluvia y tráfico aéreo.',
  Environment: CyberpunkEnvironment,
  Building: CyberpunkBuilding,
  Atmosphere: CyberpunkAtmosphere,
  InfoDisplay: CyberpunkInfoDisplay,
}
