import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GLSL_CAUSTIC } from '../procedural/shaders'

interface CausticFloorProps {
  size?: number
  color?: string
  causticColor?: string
  causticAmount?: number
  heightFn?: (x: number, z: number) => number
}

export function CausticFloor({
  size = 240,
  color = '#bda882',
  causticColor = '#9fefff',
  causticAmount = 1.05,
  heightFn,
}: CausticFloorProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, 180, 180)
    geo.rotateX(-Math.PI / 2)
    if (heightFn) {
      const p = geo.attributes.position
      for (let i = 0; i < p.count; i++) {
        p.setY(i, heightFn(p.getX(i), p.getZ(i)))
      }
      geo.computeVertexNormals()
    }
    return geo
  }, [size, heightFn])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uCaustColor: { value: new THREE.Color(causticColor) },
      uCaustAmt: { value: causticAmount },
    }),
    [color, causticColor, causticAmount]
  )

  useFrame((state) => {
    if (materialRef.current) materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vWorldPos;
          void main() {
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uColor;
          uniform vec3 uCaustColor;
          uniform float uCaustAmt;
          varying vec3 vWorldPos;
          ${GLSL_CAUSTIC}
          void main() {
            float cs = caustic(vWorldPos.xz * 0.048, uTime * 0.26);
            float haz = smoothstep(-10.0, 5.0, vWorldPos.y);
            vec3 col = uColor + uCaustColor * cs * uCaustAmt * (0.30 + haz * 0.80);
            float d = length(vWorldPos - cameraPosition);
            col = mix(col, col * vec3(0.30, 0.90, 1.18), clamp(d / 78.0, 0.0, 0.88));
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  )
}
