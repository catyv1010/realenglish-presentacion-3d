import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { v3 } from './math'

export function tube(a: THREE.Vector3, b: THREE.Vector3, r1: number, r2: number, segments = 8) {
  const dir = b.clone().sub(a)
  const len = dir.length()
  const geo = new THREE.CylinderGeometry(r2, r1, len, segments, 1, true)
  const q = new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), dir.clone().normalize())
  geo.applyMatrix4(new THREE.Matrix4().compose(a.clone().addScaledVector(dir, 0.5), q, v3(1, 1, 1)))
  return geo
}

export function sphere(p: THREE.Vector3, r: number, segments = 8) {
  const geo = new THREE.SphereGeometry(r, segments, Math.max(4, segments - 2))
  geo.translate(p.x, p.y, p.z)
  return geo
}

export function capsule(p: THREE.Vector3, r: number, h: number, segments = 8) {
  const geo = new THREE.CapsuleGeometry(r, h, 4, segments)
  geo.translate(p.x, p.y + h / 2, p.z)
  return geo
}

export function ring(radius: number, tubeRadius: number, segments = 32) {
  return new THREE.TorusGeometry(radius, tubeRadius, 8, segments)
}

export function wavyDisc(outerR: number, innerR: number, waveCount: number, amplitude: number, segments = 44) {
  const geo = new THREE.RingGeometry(innerR, outerR, segments, 3, 0, Math.PI * 2)
  const p = geo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const y = p.getY(i)
    const a = Math.atan2(y, x)
    const d = Math.hypot(x, y) - innerR
    const z = Math.sin(a * waveCount) * amplitude * d
    p.setZ(i, z)
  }
  geo.computeVertexNormals()
  return geo
}

export function mergeGeos(geos: THREE.BufferGeometry[]) {
  const valid = geos.filter((g) => g && g.attributes.position && g.attributes.position.count > 0)
  if (valid.length === 0) return new THREE.BufferGeometry()
  if (valid.length === 1) return valid[0]
  return mergeGeometries(valid, false)
}
