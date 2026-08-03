import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

interface FloatingHologramProps {
  position: [number, number, number]
  title: string
  description: string
  color: string
}

export function FloatingHologram({ position, title, description, color }: FloatingHologramProps) {
  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  const linePoints = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.6, 0),
      new THREE.Vector3(0, -1.2, 0),
      new THREE.Vector3(0, -2, 0),
    ])
    return curve.getPoints(12)
  }, [])

  useFrame((state) => {
    if (!groupRef.current || !ringRef.current) return
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.2) * 0.15
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.5
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Base de luz */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Cono de luz */}
      <mesh position={[0, -1, 0]}>
        <cylinderGeometry args={[0.05, 0.25, 2, 16, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Línea ascendente */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(linePoints.flatMap((p) => [p.x, p.y, p.z])), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.4} />
      </line>

      {/* Panel HTML */}
      <Html center style={{ pointerEvents: 'none' }}>
        <div
          style={{
            background: 'rgba(15, 10, 30, 0.65)',
            border: `1px solid ${color}66`,
            borderLeft: `3px solid ${color}`,
            borderRadius: '8px',
            padding: '12px 16px',
            width: '240px',
            backdropFilter: 'blur(6px)',
            color: '#f1f5f9',
            fontFamily: 'Inter, system-ui, sans-serif',
            textAlign: 'left',
            boxShadow: `0 0 24px ${color}33`,
          }}
        >
          <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', color, fontWeight: 700 }}>{title}</h4>
          <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.4, color: '#e2e8f0' }}>{description}</p>
        </div>
      </Html>
    </group>
  )
}
