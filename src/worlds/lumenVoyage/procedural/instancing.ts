import * as THREE from 'three'

export interface InstanceData {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
  color?: THREE.Color
}

export function buildInstancedMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  instances: InstanceData[],
  options: { castShadow?: boolean; receiveShadow?: boolean; frustumCulled?: boolean } = {}
) {
  const mesh = new THREE.InstancedMesh(geometry, material, instances.length)
  mesh.castShadow = options.castShadow ?? false
  mesh.receiveShadow = options.receiveShadow ?? true
  mesh.frustumCulled = options.frustumCulled ?? false

  const dummy = new THREE.Object3D()
  instances.forEach((data, i) => {
    dummy.position.set(...data.position)
    dummy.rotation.set(...(data.rotation ?? [0, 0, 0]))
    dummy.scale.set(...(data.scale ?? [1, 1, 1]))
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    if (data.color) mesh.setColorAt(i, data.color)
  })
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  return mesh
}

export function updateInstanceMatrices(
  mesh: THREE.InstancedMesh,
  updater: (i: number, dummy: THREE.Object3D) => void
) {
  const dummy = new THREE.Object3D()
  for (let i = 0; i < mesh.count; i++) {
    updater(i, dummy)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
  }
  mesh.instanceMatrix.needsUpdate = true
}
