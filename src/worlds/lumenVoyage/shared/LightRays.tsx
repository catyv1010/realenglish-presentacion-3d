import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LightRaysProps {
  count: number
  color: string
  bounds: { x: number; z: number; y: number }
}

export function LightRays({ count, color, bounds }: LightRaysProps) {
  const groupRef = useRef<THREE.Group>(null)
  const uTime = useRef({ value: 0 })

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uTime: uTime.current, uColor: { value: new THREE.Color(color) }, uSeed: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uSeed;
        void main() {
          float borde = smoothstep(0.0, 0.48, vUv.x) * smoothstep(1.0, 0.52, vUv.x);
          float caida = pow(vUv.y, 2.2) * smoothstep(1.0, 0.90, vUv.y);
          float ondula = 0.68 + 0.32 * sin(uTime * 0.42 + uSeed * 6.283 + vUv.y * 3.4);
          gl_FragColor = vec4(uColor, borde * caida * ondula * 0.19);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    })
  }, [color])

  useFrame((state) => {
    uTime.current.value = state.clock.elapsedTime
  })

  const rays = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const w = 4.5 + Math.random() * 7.5
      const h = bounds.y * 0.75 + Math.random() * bounds.y * 0.25
      const x = (Math.random() - 0.5) * 2 * bounds.x
      const z = (Math.random() - 0.5) * 2 * bounds.z
      return { id: i, w, h, x, z, seed: Math.random() }
    })
  }, [count, bounds])

  return (
    <group ref={groupRef}>
      {rays.map((r) => (
        <group key={r.id} position={[r.x, bounds.y * 0.46, r.z]} rotation={[0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.32]}>
          {[0, 1].map((k) => (
            <mesh key={k} rotation={[0, k * Math.PI / 2, 0]} material={material}>
              <planeGeometry args={[r.w, r.h, 1, 1]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
