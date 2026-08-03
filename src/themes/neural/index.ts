import { NeuralEnvironment } from './NeuralEnvironment'
import { NeuralBuilding } from './NeuralBuilding'
import { NeuralAtmosphere } from './NeuralAtmosphere'
import { NeuralInfoDisplay } from './NeuralInfoDisplay'
import type { ThemeDefinition } from '../types'

export const neuralTheme: ThemeDefinition = {
  id: 'neural',
  name: 'Neural Network',
  description: 'Mundo de neuronas y sinapsis con geometría orgánica y pulsos eléctricos.',
  Environment: NeuralEnvironment,
  Building: NeuralBuilding,
  Atmosphere: NeuralAtmosphere,
  InfoDisplay: NeuralInfoDisplay,
}
