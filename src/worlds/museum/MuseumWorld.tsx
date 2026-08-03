import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, MeshReflectorMaterial, Text, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import type { WorldProps } from '../types'

const WARM_BG = '#2b1f14'
const WARM_FOG = '#2b1f14'
const ACCENT = '#d4a373'
const PEDESTAL_HEIGHT = 1.4
const TARGET_SIZE = 6.0

function DustParticles({ count = 80 }: { count?: number }) {
  const points = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 26
      arr[i * 3 + 1] = 0.2 + Math.random() * 5
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!points.current) return
    points.current.rotation.y = state.clock.elapsedTime * 0.008
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#ffecd1"
        transparent
        opacity={0.18}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function MarblePedestal({ height = PEDESTAL_HEIGHT }: { height?: number }) {
  return (
    <group position={[0, height / 2, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.05, 1.15, height, 64]} />
        <meshStandardMaterial color="#9e968b" roughness={0.65} metalness={0.03} />
      </mesh>
      <mesh position={[0, height / 2 + 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.14, 1.14, 0.06, 64]} />
        <meshStandardMaterial color="#b8b0a6" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* LED sutil en la base */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.32, 64]} />
        <meshBasicMaterial color="#d4a373" transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

function AutoScaledModel({
  url,
  targetSize = TARGET_SIZE,
  pedestalHeight = PEDESTAL_HEIGHT,
  rotate = true,
  entranceDuration,
}: {
  url: string
  targetSize?: number
  pedestalHeight?: number
  rotate?: boolean
  entranceDuration: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(url)

  useLayoutEffect(() => {
    if (!groupRef.current) return
    const clone = scene.clone(true)
    clone.position.set(0, 0, 0)
    clone.rotation.set(0, 0, 0)
    clone.scale.set(1, 1, 1)

    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = maxDim > 0 ? targetSize / maxDim : 1

    // Centrar en X/Z; alinear la base (mínimo Y) con el origen
    const center = new THREE.Vector3()
    box.getCenter(center)
    clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)

    clone.scale.setScalar(scale)
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        const mat = mesh.material as THREE.MeshStandardMaterial | undefined
        if (mat && mat.emissiveIntensity !== undefined && mat.emissiveIntensity > 0.5) {
          mat.emissiveIntensity = 0.35
        }
      }
    })

    groupRef.current.clear()
    groupRef.current.add(clone)

    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: entranceDuration, ease: 'back.out(1.2)', delay: 0.2 }
    )
    gsap.fromTo(
      groupRef.current.position,
      { y: pedestalHeight + 2.5 },
      { y: pedestalHeight + 0.06, duration: entranceDuration * 1.1, ease: 'power3.out', delay: 0.05 }
    )
  }, [scene, targetSize, pedestalHeight, entranceDuration])

  useFrame((_, delta) => {
    if (!groupRef.current || !rotate) return
    groupRef.current.rotation.y += delta * 0.1
  })

  return <group ref={groupRef} position={[0, pedestalHeight + 0.06, 0]} />
}

function MuseumSpotlight({ position, target, color, intensity = 80 }: {
  position: [number, number, number]
  target: [number, number, number]
  color?: string
  intensity?: number
}) {
  const light = useRef<THREE.SpotLight>(null)
  const targetRef = useRef<THREE.Object3D>(null)

  useLayoutEffect(() => {
    if (light.current && targetRef.current) {
      light.current.target = targetRef.current
    }
  }, [])

  return (
    <>
      <spotLight
        ref={light}
        position={position}
        intensity={intensity}
        color={color ?? '#ffecd1'}
        angle={0.32}
        penumbra={0.6}
        decay={1.7}
        distance={40}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      <object3D ref={targetRef} position={target} />
    </>
  )
}

function MuseumFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <MeshReflectorMaterial
        resolution={1024}
        mirror={0.4}
        mixBlur={5}
        mixStrength={0.5}
        depthScale={1.2}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.6}
        color="#3d2e22"
        roughness={0.35}
        metalness={0.12}
      />
    </mesh>
  )
}

function MuseumHall({ accent }: { accent: string }) {
  return (
    <>
      <MuseumFloor />
      {/* Pared trasera curva sugerida */}
      <mesh position={[0, 8, -24]} receiveShadow>
        <boxGeometry args={[70, 18, 1]} />
        <meshStandardMaterial color="#241a12" roughness={0.95} />
      </mesh>
      {/* Pilares laterales */}
      {[-22, 22].map((x) => (
        <mesh key={x} position={[x, 7, -14]} castShadow receiveShadow>
          <boxGeometry args={[2, 14, 2]} />
          <meshStandardMaterial color="#2a1e15" roughness={0.9} />
        </mesh>
      ))}
      {/* Línea de acento en el horizonte */}
      <mesh position={[0, 0.06, -18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[70, 0.12]} />
        <meshBasicMaterial color={accent} transparent opacity={0.45} />
      </mesh>
    </>
  )
}

export function MuseumWorld({ scene, entranceDuration }: WorldProps) {
  const config = scene.visualConfig
  const modelUrl = config?.model
  const accent = config?.accentColor ?? ACCENT
  const { scene: scene3d } = useThree()

  scene3d.background = new THREE.Color(config?.backgroundColor ?? WARM_BG)
  scene3d.fog = new THREE.FogExp2(config?.backgroundColor ?? WARM_FOG, config?.fogDensity ?? 0.026)

  return (
    <>
      {/* Iluminación ambiental cálida */}
      <ambientLight intensity={0.28} color="#ffecd1" />
      <hemisphereLight intensity={0.2} color="#ffecd1" groundColor="#3d2e22" />

      {/* Entorno HDR para materiales PBR reales */}
      <Environment preset="warehouse" background={false} />

      {/* Focos de galería dramáticos apuntando al modelo, no al pedestal */}
      <MuseumSpotlight position={[7, 12, 8]} target={[0, PEDESTAL_HEIGHT + 3, 0]} color="#ffecd1" intensity={75} />
      <MuseumSpotlight position={[-7, 12, 8]} target={[0, PEDESTAL_HEIGHT + 3, 0]} color={accent} intensity={45} />
      <MuseumSpotlight position={[0, 14, -6]} target={[0, PEDESTAL_HEIGHT + 3, 0]} color="#ffffff" intensity={28} />

      {/* Luz de relleno suave sobre el modelo */}
      <pointLight position={[0, 8, 4]} intensity={16} color="#ffecd1" distance={20} decay={1.5} />

      <MuseumHall accent={accent} />
      <MarblePedestal height={PEDESTAL_HEIGHT} />

      {modelUrl ? (
        <AutoScaledModel
          url={modelUrl}
          targetSize={TARGET_SIZE * (config?.modelScale ?? 1)}
          pedestalHeight={PEDESTAL_HEIGHT}
          entranceDuration={entranceDuration}
        />
      ) : (
        <Text position={[0, PEDESTAL_HEIGHT + 2.5, 0]} fontSize={0.8} color="#ffecd1" anchorX="center">
          Sin modelo
        </Text>
      )}

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.45}
        scale={20}
        blur={2.5}
        far={8}
        color="#1a120c"
      />

      {/* Título flotante detrás de la pieza */}
      <Text
        position={[0, PEDESTAL_HEIGHT + 5.5, -5]}
        fontSize={0.7}
        color="#ffecd1"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.1}
        outlineWidth={0.025}
        outlineColor="#2b1f14"
      >
        {scene.title.toUpperCase()}
      </Text>

      <DustParticles count={80} />
    </>
  )
}
