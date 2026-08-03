import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface UnderwaterAtmosphereProps {
  topColor: string
  midColor: string
  bottomColor: string
  fogColor: string
  fogDensity: number
  lightColor: string
  lightIntensity?: number
}

export function UnderwaterAtmosphere({
  topColor,
  midColor,
  bottomColor,
  fogColor,
  fogDensity,
  lightColor,
  lightIntensity = 2.5,
}: UnderwaterAtmosphereProps) {
  const skyRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(topColor) },
      uMid: { value: new THREE.Color(midColor) },
      uBot: { value: new THREE.Color(bottomColor) },
    }),
    [topColor, midColor, bottomColor]
  )

  useFrame(({ camera }) => {
    if (skyRef.current) skyRef.current.position.copy(camera.position)
  })

  return (
    <>
      <color attach="background" args={[new THREE.Color(fogColor)]} />
      <fogExp2 attach="fog" args={[new THREE.Color(fogColor), fogDensity]} />
      <ambientLight intensity={0.15} color={midColor} />
      <hemisphereLight intensity={0.4} color={topColor} groundColor={bottomColor} />
      <directionalLight
        color={lightColor}
        intensity={lightIntensity}
        position={[-16, 52, 14]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-42}
        shadow-camera-right={42}
        shadow-camera-top={42}
        shadow-camera-bottom={-42}
        shadow-camera-near={1}
        shadow-camera-far={130}
        shadow-bias={-0.0013}
      />
      <mesh ref={skyRef} renderOrder={-1}>
        <sphereGeometry args={[220, 32, 20]} />
        <shaderMaterial
          side={THREE.BackSide}
          fog={false}
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={`
            varying float vH;
            void main() {
              vH = position.y / 220.0;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            varying float vH;
            uniform vec3 uTop, uMid, uBot;
            void main() {
              float h = clamp(vH * 0.5 + 0.5, 0.0, 1.0);
              vec3 c = mix(uBot, uMid, smoothstep(0.34, 0.58, h));
              c = mix(c, uTop, smoothstep(0.60, 0.92, h));
              gl_FragColor = vec4(c, 1.0);
            }
          `}
        />
      </mesh>
    </>
  )
}
