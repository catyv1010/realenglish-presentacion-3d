import { registerWorld } from './registry'
import { JourneyWorld } from './journey/JourneyWorld'
import { WatercolorWorld } from './watercolor/WatercolorWorld'
import { NeuroWorld } from './neuro/NeuroWorld'
import { PlaneWorld } from './plane/PlaneWorld'
import { GardenWorld } from './garden/GardenWorld'
import { ToyTrainWorld } from './toytrain/ToyTrainWorld'
import { MuseumWorld } from './museum/MuseumWorld'
import { LumenCityWorld } from './lumenCity/LumenCityWorld'
import { LumenBioWorld } from './lumenBio/LumenBioWorld'
import { LumenVoyageWorld } from './lumenVoyage/LumenVoyageWorld'

registerWorld({
  id: 'journey',
  name: 'Journey Dorado',
  description: 'Dunas de arena dorada, atardecer épico y monumentos antiguos.',
  World: JourneyWorld,
})

registerWorld({
  id: 'watercolor',
  name: 'Acuarela Terapéutica',
  description: 'Manchas orgánicas pastel sobre fondo crema, suaves y terapéuticas.',
  World: WatercolorWorld,
})

registerWorld({
  id: 'neuro',
  name: 'Neurociencia Viva',
  description: 'Neuronas vibrantes sobre fondo blanco limpio, estilo laboratorio premium.',
  World: NeuroWorld,
})

registerWorld({
  id: 'plane',
  name: 'Avión / Viaje',
  description: 'Avión estilizado que vuela por nubes y paisajes surrealistas siguiendo el mouse.',
  World: PlaneWorld,
})

registerWorld({
  id: 'garden',
  name: 'Jardín Interactivo',
  description: 'Jardín colorido con flores y una mariposa que sigue el mouse.',
  World: GardenWorld,
})

registerWorld({
  id: 'toytrain',
  name: 'Tren de Juguete',
  description: 'Diorama tipo juego de madera con tren que recorre vías y casitas de colores.',
  World: ToyTrainWorld,
})

registerWorld({
  id: 'museum',
  name: 'Galería Premium',
  description: 'Sala de museo con modelos PBR reales, iluminación cinematográfica y pedestal de mármol.',
  World: MuseumWorld,
})

registerWorld({
  id: 'lumen-city',
  name: 'Ciudad de la Mente',
  description: 'Mundo explorable futurista donde cada edificio representa un concepto real de Lumen Health.',
  World: LumenCityWorld,
})

registerWorld({
  id: 'lumen-bio',
  name: 'Microcosmos Vivo',
  description: 'Mundo orgánico y bioluminiscente donde cada concepto de Lumen Health es una célula, axón o proteína.',
  World: LumenBioWorld,
})

registerWorld({
  id: 'lumen-voyage',
  name: 'Viaje a las Profundidades',
  description: 'Viaje submarino cinematográfico por extracción, transformación y carga de datos de Lumen Health.',
  World: LumenVoyageWorld,
})
