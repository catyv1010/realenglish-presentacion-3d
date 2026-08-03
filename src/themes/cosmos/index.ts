import { CosmosEnvironment } from './CosmosEnvironment'
import { CosmosBuilding } from './CosmosBuilding'
import { CosmosAtmosphere } from './CosmosAtmosphere'
import { CosmosInfoDisplay } from './CosmosInfoDisplay'
import type { ThemeDefinition } from '../types'

export const cosmosTheme: ThemeDefinition = {
  id: 'cosmos',
  name: 'Data Cosmos',
  description: 'Galaxia de datos con planetas, anillos y constelaciones.',
  Environment: CosmosEnvironment,
  Building: CosmosBuilding,
  Atmosphere: CosmosAtmosphere,
  InfoDisplay: CosmosInfoDisplay,
}
