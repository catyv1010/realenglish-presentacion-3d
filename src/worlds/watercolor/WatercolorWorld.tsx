import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import type { WorldProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

// Fondo crema suave con textura sutil
function WatercolorBackground() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#faf9f6'
    ctx.fillRect(0, 0, 512, 512)
    // Manchas muy suaves
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const r = 80 + Math.random() * 120
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      const colors = ['rgba(244, 114, 182, 0.08)', 'rgba(167, 139, 250, 0.06)', 'rgba(110, 231, 183, 0.07)']
      g.addColorStop(0, colors[i % 3])
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    return new THREE.CanvasTexture(canvas)
  }, [])

  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[200, 32, 32]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  )
}

// Mancha de tinta orgánica
function InkBlob({ position, color, scale, delay, entranceDuration, label }: {
  position: [number, number, number]
  color: string
  scale: number
  delay: number
  entranceDuration: number
  label?: string
}) {
  const groupRef = useRef<THREE.Group>(null)
  const analysis = useAudioStore((state) => state.analysis)

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 32, 32)
    const pos = geo.attributes.position.array as Float32Array
    for (let i = 0; i < pos.length; i += 3) {
      const v = new THREE.Vector3(pos[i], pos[i + 1], pos[i + 2])
      const noise =
        Math.sin(v.x * 3 + v.y * 2) * 0.25 +
        Math.cos(v.y * 4 + v.z * 3) * 0.2 +
        Math.sin(v.z * 5) * 0.15
      v.multiplyScalar(1 + noise)
      pos[i] = v.x
      pos[i + 1] = v.y
      pos[i + 2] = v.z
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: scale, y: scale, z: scale, duration: entranceDuration * 1.2, delay, ease: 'elastic.out(1, 0.6)' }
    )
    gsap.fromTo(
      groupRef.current.position,
      { y: position[1] - 5 },
      { y: position[1], duration: entranceDuration * 1.1, delay, ease: 'power2.out' }
    )
  }, [entranceDuration, delay, position, scale])

  useFrame((state) => {
    if (!groupRef.current) return
    const pulse = 1 + analysis.average * 0.05
    groupRef.current.scale.setScalar(scale * pulse)
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.03
    groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.05
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.55}
          roughness={0.4}
          metalness={0}
          transmission={0.15}
          clearcoat={0.3}
        />
      </mesh>
      {label && (
        <Text position={[0, scale * 1.3, 0]} fontSize={0.5} color="#57534e" anchorX="center">
          {label}
        </Text>
      )}
    </group>
  )
}

// Pinceladas flotantes
function BrushStrokes({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60
      arr[i * 3 + 1] = Math.random() * 25
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = state.clock.elapsedTime * 0.01
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.01
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f9a8d4" size={0.2} transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

export function WatercolorWorld({ scene, quality, entranceDuration }: WorldProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  scene3d.background = new THREE.Color('#faf9f6')
  scene3d.fog = new THREE.Fog('#faf9f6', 30, 100)

  const strokeCount = quality === 'high' ? 600 : quality === 'medium' ? 300 : 120
  const palette = ['#f472b6', '#a78bfa', '#6ee7b7', '#fbbf24', '#60a5fa']

  return (
    <>
      <ambientLight intensity={0.9} color="#fff7ed" />
      <directionalLight position={[10, 20, 10]} intensity={0.8} color="#fef3c7" castShadow />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#f9a8d4" distance={80} decay={2} />

      <WatercolorBackground />

      {config?.buildings?.map((b, i) => (
        <InkBlob
          key={b.id}
          position={b.position as [number, number, number]}
          color={b.color ?? palette[i % palette.length]}
          scale={Math.max(b.size[0], b.size[2]) * 0.6}
          delay={b.entranceDelay ?? 0}
          entranceDuration={entranceDuration}
          label={b.label}
        />
      ))}

      <BrushStrokes count={strokeCount} />

      <Text
        position={[0, 11, -15]}
        fontSize={1.6}
        color="#57534e"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
      >
        {scene.title}
      </Text>
    </>
  )
}
