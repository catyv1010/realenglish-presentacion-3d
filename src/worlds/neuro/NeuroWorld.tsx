import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import type { WorldProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

// Fondo blanco limpio de laboratorio
function CleanBackground() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 512, 512)
    // Líneas sutiles tipo grid médico
    ctx.strokeStyle = 'rgba(226, 232, 240, 0.5)'
    ctx.lineWidth = 1
    for (let i = 0; i < 512; i += 32) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 512)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(512, i)
      ctx.stroke()
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

// Neurona estilizada: soma + dendritas + axón
function Neuron({ position, color, scale, delay, entranceDuration, label }: {
  position: [number, number, number]
  color: string
  scale: number
  delay: number
  entranceDuration: number
  label?: string
}) {
  const groupRef = useRef<THREE.Group>(null)
  const analysis = useAudioStore((state) => state.analysis)

  const dendrites = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const angle = (i / 6) * Math.PI * 2
      const length = 2 + Math.random() * 2
      return {
        start: [0, 0, 0] as [number, number, number],
        end: [Math.cos(angle) * length, Math.sin(angle) * length + 1, 0] as [number, number, number],
        control: [Math.cos(angle + 0.5) * length * 0.6, Math.sin(angle + 0.5) * length * 0.6 + 1.5, Math.random() - 0.5] as [number, number, number],
      }
    })
  }, [])

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: scale, y: scale, z: scale, duration: entranceDuration * 1.1, delay, ease: 'back.out(1.7)' }
    )
    gsap.fromTo(
      groupRef.current.position,
      { y: position[1] - 8 },
      { y: position[1], duration: entranceDuration * 1.2, delay, ease: 'power3.out' }
    )
  }, [entranceDuration, delay, position, scale])

  useFrame((state) => {
    if (!groupRef.current) return
    const pulse = 1 + analysis.bass * 0.1
    groupRef.current.scale.setScalar(scale * pulse)
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.04
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Soma */}
      <mesh castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.2}
          metalness={0.1}
          clearcoat={0.8}
        />
      </mesh>

      {/* Núcleo */}
      <mesh scale={0.4}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* Dendritas como curvas */}
      {dendrites.map((d, i) => {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(...d.start),
          new THREE.Vector3(...d.control),
          new THREE.Vector3(...d.end)
        )
        const points = curve.getPoints(20)
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color, linewidth: 2 })
        const line = new THREE.Line(geometry, material)
        return <primitive key={i} object={line} />
      })}

      {/* Axón */}
      <mesh position={[0, -2.5, 0]}>
        <cylinderGeometry args={[0.15, 0.05, 3, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {label && (
        <Text position={[0, 3.5, 0]} fontSize={0.45} color="#334155" anchorX="center">
          {label}
        </Text>
      )}
    </group>
  )
}

// Impulsos nerviosos que viajan entre neuronas
function NeuralImpulses({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 50
      arr[i * 3 + 1] = Math.random() * 20
      arr[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += 0.03 + Math.sin(time + i) * 0.01
      if (pos[i * 3 + 1] > 25) pos[i * 3 + 1] = 0
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#06b6d4" size={0.18} transparent opacity={0.8} sizeAttenuation />
    </points>
  )
}

export function NeuroWorld({ scene, quality, entranceDuration }: WorldProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  scene3d.background = new THREE.Color('#ffffff')
  scene3d.fog = new THREE.Fog('#ffffff', 25, 90)

  const impulseCount = quality === 'high' ? 500 : quality === 'medium' ? 250 : 100
  const palette = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']

  return (
    <>
      <ambientLight intensity={0.85} color="#ffffff" />
      <directionalLight position={[10, 20, 10]} intensity={0.7} color="#e2e8f0" castShadow />
      <pointLight position={[0, 10, 0]} intensity={0.6} color="#06b6d4" distance={80} decay={2} />

      <CleanBackground />

      {config?.buildings?.map((b, i) => (
        <Neuron
          key={b.id}
          position={b.position as [number, number, number]}
          color={b.color ?? palette[i % palette.length]}
          scale={Math.max(b.size[0], b.size[2]) * 0.35}
          delay={b.entranceDelay ?? 0}
          entranceDuration={entranceDuration}
          label={b.label}
        />
      ))}

      <NeuralImpulses count={impulseCount} />

      <Text
        position={[0, 11, -15]}
        fontSize={1.5}
        color="#334155"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.02}
      >
        {scene.title}
      </Text>
    </>
  )
}
