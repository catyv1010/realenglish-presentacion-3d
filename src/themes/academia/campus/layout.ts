/**
 * Reglas de donde SI y donde NO se puede poner vida en el campus.
 *
 * Hay tres zonas que tienen que quedar limpias:
 *   1. El centro (r < 13): ahi caen los edificios de cada escena y el camino
 *      circular. Un arbol ahi taparia el contenido de la presentacion.
 *   2. El pasillo de la camara: todas las camaras miran desde +Z hacia el
 *      centro, asi que lo que este justo enfrente estorba la vista.
 *   3. El monumento del libro (0, -30) y el arco de portales del MCER (r ~ 26
 *      con Z negativa), que ya son parte del decorado fijo.
 *
 * Las cosas bajitas (zacate, flores, conejos) solo respetan la primera:
 * a la altura del suelo no tapan nada y llenan mucho el cuadro.
 */
export function isFreeGround(x: number, z: number, alturaAprox = 5): boolean {
  const r2 = x * x + z * z

  // 1. El centro siempre libre.
  const radioCentro = alturaAprox < 2 ? 12.5 : 15
  if (r2 < radioCentro * radioCentro) return false

  // El monumento del libro abierto.
  if (x * x + (z + 30) * (z + 30) < 90) return false

  // La laguna: ni arboles dentro del agua ni zacate flotando.
  const dxL = x - LAGUNA[0]
  const dzL = z - LAGUNA[1]
  const radioLaguna = alturaAprox < 2 ? LAGUNA_R + 0.8 : LAGUNA_R + 2.5
  if (dxL * dxL + dzL * dzL < radioLaguna * radioLaguna) return false

  // El monte de la base de datos. Aqui NO se separa por altura: el terreno
  // sube cinco metros, asi que hasta una mata de zacate quedaria flotando en
  // el aire si se sembrara sobre la ladera.
  const dxB = x - BASE_DATOS[0]
  const dzB = z - BASE_DATOS[1]
  if (dxB * dxB + dzB * dzB < BASE_DATOS_R * BASE_DATOS_R) return false

  if (alturaAprox < 2) return true

  // 2. Pasillo de la camara: enfrente del campus no se planta nada alto, y en
  //    el primer plano el hueco es todavia mas ancho. Un arbol a diez metros
  //    del lente tapa media pantalla aunque este "a un lado".
  if (z > 8 && Math.abs(x) < 15) return false
  if (z > 14 && Math.abs(x) < 22) return false

  // 3. El arco de portales A1..C2.
  const r = Math.sqrt(r2)
  if (z < -2 && r > 22 && r < 30) return false

  // 4. Avenida de vista hacia el monte de la base de datos. El monumento esta
  //    a sesenta metros y los arboles del fondo, aunque son mas bajos, se le
  //    plantaban justo delante y solo dejaban asomar el rotulo. Se despeja una
  //    franja recta desde la plaza hasta el monte: de paso se lee como una
  //    avenida que lleva hasta el, que es justo lo que se quiere contar.
  const largo2 = BASE_DATOS[0] * BASE_DATOS[0] + BASE_DATOS[1] * BASE_DATOS[1]
  const t = (x * BASE_DATOS[0] + z * BASE_DATOS[1]) / largo2
  if (t > 0.3 && t < 1) {
    const dx = x - BASE_DATOS[0] * t
    const dz = z - BASE_DATOS[1] * t
    if (dx * dx + dz * dz < 30) return false
  }

  return true
}

/** Radio del camino circular por donde caminan los estudiantes. */
export const RADIO_CAMINO = 11.5

/**
 * Las ocho bancas del sendero, en sitio fijo.
 *
 * Viven aqui y no dentro de `CampusProps` porque la gente se sienta en ellas:
 * si cada componente calculara sus propias posiciones, los estudiantes
 * acabarian sentados en el aire en cuanto una de las dos formulas cambiara.
 * `CampusProps` dibuja las bancas y `CampusPeople` lee estas mismas coordenadas.
 */
export const BANCAS: { pos: [number, number, number]; giro: number }[] = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 + 0.35
  const r = RADIO_CAMINO + 2.9
  return { pos: [Math.cos(a) * r, 0, Math.sin(a) * r] as [number, number, number], giro: -a + Math.PI / 2 }
})

/** Altura del asiento de la banca: donde tiene que quedar la cadera. */
export const BANCA_ASIENTO = 0.44

/** Centro y radio de la laguna, en el costado derecho del campus. */
export const LAGUNA: [number, number] = [27, -22]
export const LAGUNA_R = 8

/**
 * El monumento a la base de datos, al fondo a la derecha.
 *
 * Va detras del arco de portales y fuera de el (r > 30), donde la camara de
 * las catorce escenas lo tiene siempre dentro del cuadro pero nunca encima
 * del contenido. Tan atras porque se levanta sobre un monte ancho: mas cerca,
 * la ladera se tragaba la esquina del monumento del libro que hay en (0, -30).
 */
export const BASE_DATOS: [number, number] = [20, -40]
/** Cubre el pie del monte (radio 14.5) con un poco de margen. */
export const BASE_DATOS_R = 15.5
