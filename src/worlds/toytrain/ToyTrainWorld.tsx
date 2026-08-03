import { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import type { WorldProps } from '../types'
import { useAudioStore } from '../../store/useAudioStore'

// Tren de juguete low poly
function ToyTrain({ progress }: { progress: number }) {
  const ref = useRef<THREE.Group>(null)
  const path = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-20, 0.8, -10),
      new THREE.Vector3(-10, 0.8, -15),
      new THREE.Vector3(0, 0.8, -5),
      new THREE.Vector3(10, 0.8, -15),
      new THREE.Vector3(20, 0.8, -10),
      new THREE.Vector3(15, 0.8, 5),
      new THREE.Vector3(0, 0.8, 12),
      new THREE.Vector3(-15, 0.8, 5),
      new THREE.Vector3(-20, 0.8, -10),
    ], true)
  }, [])

  useFrame((state) => {
    if (!ref.current) return
    const t = (state.clock.elapsedTime * 0.03 + progress) % 1
    const pos = path.getPoint(t)
    const tangent = path.getTangent(t)
    ref.current.position.copy(pos)
    ref.current.lookAt(pos.clone().add(tangent))
  })

  return (
    <group ref={ref} scale={0.6}>
      {/* Locomotora */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2, 1.2, 1.2]} />
        <meshStandardMaterial color="#ef4444" roughness={0.4} />
      </mesh>
      <mesh position={[0.5, 1.4, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.9]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.4} />
      </mesh>
      <mesh position={[-1, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Ruedas */}
      {[-0.6, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ))}
      {[-0.6, 0.6].map((x, i) => (
        <mesh key={i} position={[x, 0.3, -0.65]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
      ))}
    </group>
  )
}

// Vía de tren tipo madera
function Track() {
  const path = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-20, 0, -10),
      new THREE.Vector3(-10, 0, -15),
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(10, 0, -15),
      new THREE.Vector3(20, 0, -10),
      new THREE.Vector3(15, 0, 5),
      new THREE.Vector3(0, 0, 12),
      new THREE.Vector3(-15, 0, 5),
      new THREE.Vector3(-20, 0, -10),
    ], true)
  }, [])

  const points = useMemo(() => path.getPoints(80), [path])

  return (
    <>
      {points.map((p, i) => {
        const next = points[(i + 1) % points.length]
        const mid = p.clone().add(next).multiplyScalar(0.5)
        const dir = next.clone().sub(p)
        const angle = Math.atan2(dir.x, dir.z)
        return (
          <group key={i} position={mid} rotation={[0, angle, 0]}>
            <mesh position={[-0.35, 0.05, 0]}>
              <boxGeometry args={[0.15, 0.1, 0.8]} />
              <meshStandardMaterial color="#d97706" roughness={0.8} />
            </mesh>
            <mesh position={[0.35, 0.05, 0]}>
              <boxGeometry args={[0.15, 0.1, 0.8]} />
              <meshStandardMaterial color="#d97706" roughness={0.8} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

// Casita de juguete
function ToyHouse({ position, color, delay, entranceDuration, label }: {
  position: [number, number, number]
  color: string
  delay: number
  entranceDuration: number
  label?: string
}) {
  const ref = useRef<THREE.Group>(null)
  const analysis = useAudioStore((state) => state.analysis)

  useLayoutEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current.scale,
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: entranceDuration, delay, ease: 'back.out(1.7)' }
    )
    gsap.fromTo(
      ref.current.position,
      { y: position[1] + 10 },
      { y: position[1], duration: entranceDuration * 1.2, delay, ease: 'bounce.out' }
    )
  }, [entranceDuration, delay, position])

  useFrame(() => {
    if (!ref.current) return
    const pulse = 1 + analysis.bass * 0.05
    ref.current.scale.setScalar(pulse)
  })

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <coneGeometry args={[1.6, 1.5, 4]} />
        <meshStandardMaterial color="#f43f5e" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.5, 1.05]}>
        <boxGeometry args={[0.6, 0.8, 0.1]} />
        <meshStandardMaterial color="#60a5fa" roughness={0.2} />
      </mesh>
      {label && (
        <Text position={[0, 2.8, 0]} fontSize={0.5} color="#1f2937" anchorX="center">
          {label}
        </Text>
      )}
    </group>
  )
}

// Árbol de juguete
function ToyTree({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 1, 8]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
    </group>
  )
}

// Mesa/mesa de juego
function PlayTable() {
  return (
    <mesh position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial color="#fde68a" roughness={0.9} />
    </mesh>
  )
}

export function ToyTrainWorld({ scene, entranceDuration }: WorldProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  scene3d.background = new THREE.Color('#fef3c7')
  scene3d.fog = new THREE.Fog('#fef3c7', 40, 130)

  const trees = useMemo(() => {
    return Array.from({ length: 16 }).map(() => ({
      position: [(Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 60] as [number, number, number],
      scale: 0.7 + Math.random() * 0.6,
    }))
  }, [])

  const pastelColors = ['#fca5a5', '#fdba74', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4']

  return (
    <>
      <ambientLight intensity={0.75} color="#fff7ed" />
      <directionalLight position={[20, 30, 15]} intensity={1} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} />

      <PlayTable />
      <Track />

      {trees.map((t, i) => (
        <ToyTree key={i} {...t} />
      ))}

      {config?.buildings?.map((b, i) => (
        <ToyHouse
          key={b.id}
          position={[b.position[0], 0, b.position[2]]}
          color={b.color ?? pastelColors[i % pastelColors.length]}
          delay={b.entranceDelay ?? 0}
          entranceDuration={entranceDuration}
          label={b.label}
        />
      ))}

      <ToyTrain progress={0} />

      <Text
        position={[0, 12, -25]}
        fontSize={2}
        color="#ea580c"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#ffffff"
      >
        {scene.title}
      </Text>
    </>
  )
}
