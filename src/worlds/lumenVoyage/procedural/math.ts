import * as THREE from 'three'

export function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul((t ^ (t >>> 7)), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Rng {
  private rng: () => number
  constructor(seed = 20260727) {
    this.rng = mulberry32(seed)
  }
  next() {
    return this.rng()
  }
  range(a: number, b: number) {
    return a + (b - a) * this.rng()
  }
  rangeInt(a: number, b: number) {
    return Math.floor(this.range(a, b + 1))
  }
  pick<T>(arr: T[]) {
    return arr[Math.floor(this.rng() * arr.length)]
  }
}

export function hash2(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

export function vnoise(x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const ux = fx * fx * (3 - 2 * fx)
  const uy = fy * fy * (3 - 2 * fy)
  const a = hash2(ix, iy)
  const b = hash2(ix + 1, iy)
  const c = hash2(ix, iy + 1)
  const d = hash2(ix + 1, iy + 1)
  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy
}

export function fbm(x: number, y: number, octaves = 4) {
  let v = 0
  let a = 0.5
  let f = 1
  for (let i = 0; i < octaves; i++) {
    v += a * vnoise(x * f, y * f)
    f *= 2
    a *= 0.5
  }
  return v
}

export function fbm3(x: number, y: number, z: number, octaves = 4) {
  let v = 0
  let a = 0.5
  let f = 1
  for (let i = 0; i < octaves; i++) {
    v += a * (vnoise(x * f, y * f) + vnoise(y * f, z * f) + vnoise(z * f, x * f)) / 3
    f *= 2
    a *= 0.5
  }
  return v
}

export function v3(x: number, y: number, z: number) {
  return new THREE.Vector3(x, y, z)
}
