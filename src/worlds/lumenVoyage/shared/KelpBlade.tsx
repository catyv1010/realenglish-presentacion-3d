import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface KelpBladeProps {
  position?: [number, number, number]
  height?: number
  color?: string
  swaySpeed?: number
  swayAmount?: number
}

export function KelpBlade({ position = [0, 0, 0], height = 8, color = '#10b981', swaySpeed = 0.8, swayAmount = 0.4 }: KelpBladeProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSwaySpeed: { value: swaySpeed },
      uSwayAmount: { value: swayAmount },
      uHeight: { value: height },
      uColor: { value: new THREE.Color(color) },
    }),
    [swaySpeed, swayAmount, height, color]
  )

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[0.35, height, 1, 24]} />
      <shaderMaterial
        transparent
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          uniform float uSwaySpeed;
          uniform float uSwayAmount;
          uniform float uHeight;
          varying vec2 vUv;
          varying float vHeight;
          
          void main() {
            vUv = uv;
            vHeight = position.y;
            vec3 pos = position;
            float normalizedY = (position.y + uHeight * 0.5) / uHeight;
            float wave1 = sin(uTime * uSwaySpeed + normalizedY * 3.0) * uSwayAmount * normalizedY * normalizedY;
            float wave2 = cos(uTime * uSwaySpeed * 0.7 + normalizedY * 2.0) * uSwayAmount * 0.5 * normalizedY * normalizedY;
            pos.x += wave1;
            pos.z += wave2;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          varying vec2 vUv;
          varying float vHeight;
          
          void main() {
            vec3 color = uColor;
            float tipGlow = smoothstep(0.2, 0.9, vUv.y);
            color += vec3(0.15, 0.4, 0.3) * tipGlow;
            float alpha = 0.85 - vUv.x * 0.3;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  )
}
