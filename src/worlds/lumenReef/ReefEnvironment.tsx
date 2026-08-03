import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../types/presentation'

interface ReefEnvironmentProps {
  quality: QualityLevel
}

const ROYAL_ABYSS = '#001a4d'

function CausticsPlane() {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  )

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
      <planeGeometry args={[160, 160, 1, 1]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            float c1 = sin(vUv.x * 42.0 + uTime * 0.6) * cos(vUv.y * 31.0 + uTime * 0.4);
            float c2 = sin(vUv.x * 58.0 - uTime * 0.5) * sin(vUv.y * 44.0 + uTime * 0.7);
            float c3 = cos(vUv.x * 25.0 + uTime * 0.3) * sin(vUv.y * 35.0 - uTime * 0.6);
            float caustic = smoothstep(0.15, 0.85, c1 * 0.4 + c2 * 0.35 + c3 * 0.25);
            gl_FragColor = vec4(vec3(0.25, 0.85, 0.95), caustic * 0.45);
          }
        `}
      />
    </mesh>
  )
}

function GodRays({ count = 6 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  const rays = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 36,
      z: (Math.random() - 0.5) * 36 - 8,
      angle: 0.06 + Math.random() * 0.12,
      length: 22 + Math.random() * 16,
      opacity: 0.06 + Math.random() * 0.05,
      hue: 190 + Math.random() * 50,
    }))
  }, [count])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.04) * 0.04
  })

  return (
    <group ref={groupRef} position={[0, 22, 0]}>
      {rays.map((ray) => (
        <mesh key={ray.id} position={[ray.x, 0, ray.z]} rotation={[ray.angle, 0, 0]}>
          <coneGeometry args={[ray.length * 0.4, ray.length, 32, 1, true]} />
          <meshBasicMaterial
            color={`hsl(${ray.hue}, 80%, 70%)`}
            transparent
            opacity={ray.opacity}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

function SurfaceLightShaft() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return
    meshRef.current.rotation.z = state.clock.elapsedTime * 0.02
    materialRef.current.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 0.5) * 0.03
  })

  return (
    <mesh ref={meshRef} position={[0, 18, 0]} rotation={[Math.PI / 3, 0, 0]}>
      <cylinderGeometry args={[8, 18, 35, 64, 1, true]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#4fd1ff"
        transparent
        opacity={0.1}
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

function Bubbles({ count, quality }: { count: number; quality: QualityLevel }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 70,
      y: Math.random() * 20,
      z: (Math.random() - 0.5) * 70,
      speed: 0.4 + Math.random() * 0.9,
      scale: 0.04 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
    }))
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    particles.forEach((p) => {
      const y = (p.y + t * p.speed) % 22
      const sway = Math.sin(t * 0.7 + p.phase) * 0.6
      dummy.position.set(p.x + sway, y, p.z)
      dummy.scale.setScalar(p.scale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(p.id, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, quality === 'low' ? 6 : 8, quality === 'low' ? 6 : 8]} />
      <meshBasicMaterial color="#c7f9ff" transparent opacity={0.45} depthWrite={false} />
    </instancedMesh>
  )
}

function Plankton({ count, quality }: { count: number; quality: QualityLevel }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    const hues = [0.45, 0.5, 0.55, 0.75, 0.85]
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 90,
      y: Math.random() * 18,
      z: (Math.random() - 0.5) * 90,
      speed: 0.04 + Math.random() * 0.12,
      scale: 0.025 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
      color: new THREE.Color().setHSL(hues[i % hues.length], 0.9, 0.6),
    }))
  }, [count])

  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return
    const t = state.clock.elapsedTime
    particles.forEach((p) => {
      const x = p.x + Math.sin(t * p.speed + p.phase) * 2.5
      const y = p.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.6
      const z = p.z + Math.sin(t * p.speed * 0.5 + p.phase) * 2.5
      dummy.position.set(x, y, z)
      const pulse = 1 + Math.sin(t * 2 + p.phase) * 0.3
      dummy.scale.setScalar(p.scale * pulse)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(p.id, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, quality === 'low' ? 4 : 6, quality === 'low' ? 4 : 6]} />
      <meshBasicMaterial ref={materialRef} color="#ffffff" transparent opacity={0.75} depthWrite={false} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  )
}

function KelpForest({ count = 12, quality }: { count?: number; quality: QualityLevel }) {
  const groupRef = useRef<THREE.Group>(null)
  const kelps = useMemo(() => Array.from({ length: count }, (_, i) => i), [count])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(t * 0.6 + i * 0.8) * 0.12
      child.rotation.x = Math.cos(t * 0.4 + i * 0.6) * 0.08
    })
  })

  return (
    <group ref={groupRef}>
      {kelps.map((i) => {
        const angle = (i / count) * Math.PI * 2
        const radius = 16 + Math.random() * 8
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const height = 5 + Math.random() * 5
        const color = i % 2 === 0 ? '#15803d' : '#166534'
        return (
          <mesh key={i} position={[x, height / 2, z]}>
            <cylinderGeometry args={[0.08, 0.18, height, quality === 'low' ? 6 : 8, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

function FishSchool({ count, quality }: { count: number; quality: QualityLevel }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const fish = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2,
      radius: 8 + Math.random() * 6,
      height: 4 + Math.random() * 4,
      speed: 0.3 + Math.random() * 0.3,
      scale: 0.06 + Math.random() * 0.04,
      phase: Math.random() * Math.PI * 2,
      color: new THREE.Color().setHSL(0.45 + Math.random() * 0.25, 0.9, 0.65),
    }))
  }, [count])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    fish.forEach((f) => {
      const a = f.angle + t * f.speed * 0.15
      const r = f.radius + Math.sin(t * 0.5 + f.phase) * 1.5
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      const y = f.height + Math.sin(t * 0.8 + f.phase) * 0.8
      dummy.position.set(x, y, z)
      dummy.rotation.y = -a
      dummy.scale.setScalar(f.scale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(f.id, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <coneGeometry args={[1, 2.5, quality === 'low' ? 4 : 6]} />
      <meshStandardMaterial color="#ffffff" emissive="#22d3ee" emissiveIntensity={0.8} toneMapped={false} />
    </instancedMesh>
  )
}

function SandyFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[220, 220, 64, 64]} />
      <meshStandardMaterial color="#0d2b4a" roughness={0.95} metalness={0.05} />
    </mesh>
  )
}

export function ReefEnvironment({ quality }: ReefEnvironmentProps) {
  const { scene: scene3d } = useThree()

  const bubbleCount = quality === 'low' ? 60 : quality === 'medium' ? 120 : 200
  const planktonCount = quality === 'low' ? 120 : quality === 'medium' ? 240 : 380
  const fishCount = quality === 'low' ? 20 : quality === 'medium' ? 40 : 70

  useEffect(() => {
    scene3d.background = new THREE.Color(ROYAL_ABYSS)
    scene3d.fog = new THREE.FogExp2(ROYAL_ABYSS, 0.012)
    return () => {
      scene3d.background = new THREE.Color('#020205')
      scene3d.fog = null
    }
  }, [scene3d])

  return (
    <>
      <ambientLight intensity={0.45} color="#2563eb" />
      <hemisphereLight intensity={0.42} color="#38bdf8" groundColor="#001a4d" />
      <directionalLight
        position={[12, 45, 8]}
        intensity={1.6}
        color="#7dd3fc"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />

      <SandyFloor />
      <CausticsPlane />
      <GodRays count={quality === 'low' ? 4 : 6} />
      <SurfaceLightShaft />
      <Bubbles count={bubbleCount} quality={quality} />
      <Plankton count={planktonCount} quality={quality} />
      <KelpForest count={quality === 'low' ? 8 : 14} quality={quality} />
      <FishSchool count={fishCount} quality={quality} />
    </>
  )
}
