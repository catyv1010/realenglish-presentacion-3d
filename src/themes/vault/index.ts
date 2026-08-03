import { VaultEnvironment } from './VaultEnvironment'
import { VaultBuilding } from './VaultBuilding'
import { VaultAtmosphere } from './VaultAtmosphere'
import type { ThemeDefinition } from '../types'

export const vaultTheme: ThemeDefinition = {
  id: 'vault',
  name: 'Bóveda de Seguridad',
  description: 'Bóveda acorazada con diales giratorios, láseres de vigilancia y polvo dorado.',
  Environment: VaultEnvironment,
  Building: VaultBuilding,
  Atmosphere: VaultAtmosphere,
}
