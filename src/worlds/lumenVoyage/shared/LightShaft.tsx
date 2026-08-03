import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LightShaftProps {
  position?: [number, number, number]
  height?: number
  radius?: number
  color?: string
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    float falloff = pow(1.0 - vUv.y, 1.8);
    float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
    float alpha = falloff * uOpacity * edge;
    gl_FragColor = vec4(uColor, alpha);
  }
`

export function LightShaft({ position = [0, 0, 0], height = 8, radius = 1.2, color = '#d946ef' }: LightShaftProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: 0.18 },
    }),
    [color]
  )

  useFrame((state) => {
    if (materialRef.current) {
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.08
      materialRef.current.uniforms.uOpacity.value = pulse
    }
  })

  return (
    <mesh position={position} rotation={[0, 0, 0]}>
      <cylinderGeometry args={[radius, radius * 0.2, height, 32, 1, true]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}
