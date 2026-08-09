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

  if (alturaAprox < 2) return true

  // 2. Pasillo de la camara: enfrente del campus no se planta nada alto, y en
  //    el primer plano el hueco es todavia mas ancho. Un arbol a diez metros
  //    del lente tapa media pantalla aunque este "a un lado".
  if (z > 8 && Math.abs(x) < 15) return false
  if (z > 14 && Math.abs(x) < 22) return false

  // 3. El arco de portales A1..C2.
  const r = Math.sqrt(r2)
  if (z < -2 && r > 22 && r < 30) return false

  return true
}

/** Radio del camino circular por donde caminan los estudiantes. */
export const RADIO_CAMINO = 11.5

/** Centro y radio de la laguna, en el costado derecho del campus. */
export const LAGUNA: [number, number] = [27, -22]
export const LAGUNA_R = 8
