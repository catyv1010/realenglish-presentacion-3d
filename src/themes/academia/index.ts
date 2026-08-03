import { AcademiaEnvironment } from './AcademiaEnvironment'
import { AcademiaBuilding } from './AcademiaBuilding'
import { AcademiaAtmosphere } from './AcademiaAtmosphere'
import type { ThemeDefinition } from '../types'

export const academiaTheme: ThemeDefinition = {
  id: 'academia',
  name: 'Campus Real English',
  description:
    'Campus soleado de una academia de inglés: torres de libros, portales del camino MCER (A1 a C2), letras flotantes, aviones de papel y la paleta índigo/coral del sitio real.',
  Environment: AcademiaEnvironment,
  Building: AcademiaBuilding,
  Atmosphere: AcademiaAtmosphere,
}
