/**
 * Generador pseudoaleatorio con semilla (mulberry32).
 *
 * El campus tiene que verse EXACTAMENTE igual en cada escena y en cada
 * ensayo: si se usara Math.random(), los arboles y la gente saltarian de
 * lugar cada vez que React vuelve a montar la escena, y en una defensa eso
 * se nota. Con semilla fija, el mismo numero siempre da el mismo campus.
 */
export function makeRng(seed: number) {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Numero al azar dentro de un rango. */
export function range(rng: () => number, min: number, max: number) {
  return min + rng() * (max - min)
}

/** Elige un elemento de la lista. */
export function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length) % list.length]
}
