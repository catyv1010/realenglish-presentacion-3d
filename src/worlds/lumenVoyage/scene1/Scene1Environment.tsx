import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'
import { UnderwaterAtmosphere } from '../shared/UnderwaterAtmosphere'
import { CausticFloor } from '../shared/CausticFloor'
import { LightRays } from '../shared/LightRays'
import { MarineParticles } from '../shared/MarineParticles'
import { FishSchool } from '../shared/FishSchool'
import { ReefBuilder } from './ReefBuilder'
import { Rng, fbm } from '../procedural/math'

interface Scene1EnvironmentProps {
  quality: QualityLevel
}

function alturaArena(x: number, z: number) {
  let h = fbm(x * 0.03 + 40, z * 0.03 + 40, 4) * 4.6 - 2.3
  h += fbm(x * 0.28 + 7, z * 0.28 + 7, 3) * 0.42
  h += Math.sin(x * 1.25 + fbm(x * 0.07, z * 0.07) * 7) * 0.09
  h -= Math.exp(-(x * x) / (2 * 7.4 * 7.4)) * 3.4
  return h
}

function WaterSurface() {
  const uTime = useRef({ value: 0 })
  useFrame((state) => {
    uTime.current.value = state.clock.elapsedTime
  })
  const material = useMemo(() => {
    const GLSL_CAUSTIC = `
      float caustic(vec2 uv, float t){
        vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
        vec2 i = p; float c = 1.0; const float inten = 0.0045;
        for (int n = 0; n < 5; n++){
          float tt = t * (1.0 - (3.5 / float(n + 1)));
          i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
        }
        c /= 5.0; c = 1.17 - pow(c, 1.4);
        return clamp(pow(abs(c), 8.0), 0.0, 1.8);
      }
    `
    return new THREE.ShaderMaterial({
      uniforms: { uTime: uTime.current, uColor: { value: new THREE.Color(0xd6fbff) } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        varying vec2 vUv; uniform float uTime; uniform vec3 uColor;
        ${GLSL_CAUSTIC}
        void main(){
          float r = length(vUv - 0.5) * 2.0;
          float centro = smoothstep(1.0, 0.05, r);
          float c = caustic(vUv * 22.0, uTime * 0.38);
          gl_FragColor = vec4(uColor, (clamp(c, 0.0, 1.0) * 0.26 + 0.05) * centro);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      fog: false,
    })
  }, [])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 58, 0]} material={material}>
      <circleGeometry args={[150, 64]} />
    </mesh>
  )
}

function Rocks({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const rng = useMemo(() => new Rng(20260727 + 1), [])
  const data = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: rng.range(-30, 30),
      z: rng.range(-94, 58),
      s: rng.range(0.28, 1.15),
      rot: [rng.next() * 3, rng.next() * 6, rng.next() * 3] as [number, number, number],
    }))
  }, [count, rng])

  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.5, 1)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const s = 0.75 + fbm(p.getX(i) * 3 + 3, p.getZ(i) * 3 + 3) * 0.6
      p.setXYZ(i, p.getX(i) * s, p.getY(i) * s * 0.5, p.getZ(i) * s)
    }
    g.computeVertexNormals()
    return g
  }, [])

  const dummy = new THREE.Object3D()
  useMemo(() => {
    if (!meshRef.current) return
    data.forEach((d, i) => {
      dummy.position.set(d.x, alturaArena(d.x, d.z) - 0.08, d.z)
      dummy.rotation.set(...d.rot)
      const sy = d.s * rng.range(0.5, 0.9)
      dummy.scale.set(d.s, sy, d.s * rng.range(0.8, 1.2))
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [data])

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]} receiveShadow frustumCulled={false}>
      <meshStandardMaterial color="#bda882" roughness={0.95} metalness={0} />
    </instancedMesh>
  )
}

export function Scene1Environment({ quality }: Scene1EnvironmentProps) {
  const q = quality
  const fishCount = q === 'low' ? 30 : q === 'medium' ? 60 : 95
  const particleCount = q === 'low' ? 400 : q === 'medium' ? 900 : 1900
  const bubbleCount = q === 'low' ? 15 : q === 'medium' ? 35 : 70
  const rayCount = q === 'low' ? 4 : q === 'medium' ? 8 : 12
  const rockCount = q === 'low' ? 50 : q === 'medium' ? 90 : 150

  return (
    <>
      <UnderwaterAtmosphere
        topColor="#8fe9f7"
        midColor="#0d5f80"
        bottomColor="#03202f"
        fogColor="#0d5f80"
        fogDensity={0.0152}
        lightColor="#cdf8ff"
        lightIntensity={2.5}
      />
      <pointLight color="#4fd8ff" intensity={30} distance={66} decay={2} position={[9, 7, -16]} />
      <pointLight color="#b07bff" intensity={18} distance={44} decay={2} position={[-12, 4, 9]} />

      <CausticFloor size={240} color="#bda882" causticColor="#9fefff" causticAmount={1.05} heightFn={alturaArena} />
      <Rocks count={rockCount} />
      <ReefBuilder seed={20260727} quality={q} />

      <FishSchool
        count={fishCount}
        palette={['#ffd166', '#ff9f4a', '#6ff0ff', '#f4efe2', '#ffb3d9', '#9ee6ff', '#ffe9a8']}
        area={{ x: 12, z: 30, y0: 0.8, y1: 7.5 }}
        radius={{ x: 7, z: 9 }}
        speed={1}
      />

      <LightRays count={rayCount} color="#cdf8ff" bounds={{ x: 40, z: 70, y: 62 }} />
      <WaterSurface />

      <MarineParticles count={particleCount} ext={{ x: 50, z: 70, y0: -4, y1: 40 }} size={1.5} color="#dff8ff" opacity={0.34} riseSpeed={0.35} soft />
      <MarineParticles count={bubbleCount} ext={{ x: 26, z: 44, y0: -4, y1: 40 }} size={3.4} color="#ffffff" opacity={0.42} riseSpeed={1} soft={false} />
    </>
  )
}
