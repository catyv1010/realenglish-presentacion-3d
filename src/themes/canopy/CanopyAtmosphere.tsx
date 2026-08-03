import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ThemeAtmosphereProps } from '../types'

/** Luciérnagas y esporas flotando entre la neblina del bosque nuboso. */
export function CanopyAtmosphere({ quality }: ThemeAtmosphereProps) {
  const firefliesRef = useRef<THREE.Points>(null)
  const sporesRef = useRef<THREE.Points>(null)

  const fireflyCount = quality === 'high' ? 140 : quality === 'medium' ? 90 : 50
  const sporeCount = quality === 'high' ? 220 : quality === 'medium' ? 140 : 80

  const fireflyGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(fireflyCount * 3)
    for (let i = 0; i < fireflyCount; i++) {
      const r = 4 + Math.random() * 30
      const a = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 0.6 + Math.random() * 12
      pos[i * 3 + 2] = Math.sin(a) * r
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return geo
  }, [fireflyCount])

  const sporeGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(sporeCount * 3)
    for (let i = 0; i < sporeCount; i++) {
      const r = 6 + Math.random() * 38
      const a = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = 1 + Math.random() * 18
      pos[i * 3 + 2] = Math.sin(a) * r
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return geo
  }, [sporeCount])

  const fireflyMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#fde68a',
        size: 0.18,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  )
  const sporeMat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: '#5eead4',
        size: 0.07,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (firefliesRef.current) {
      firefliesRef.current.rotation.y = t * 0.03
      firefliesRef.current.position.y = Math.sin(t * 0.6) * 0.4
      ;(firefliesRef.current.material as THREE.PointsMaterial).opacity = 0.7 + Math.sin(t * 2.4) * 0.25
    }
    if (sporesRef.current) {
      sporesRef.current.rotation.y = -t * 0.015
      sporesRef.current.position.y = Math.sin(t * 0.35 + 1.7) * 0.6
    }
  })

  return (
    <>
      <points ref={firefliesRef} geometry={fireflyGeo} material={fireflyMat} frustumCulled={false} />
      <points ref={sporesRef} geometry={sporeGeo} material={sporeMat} frustumCulled={false} />
    </>
  )
}
