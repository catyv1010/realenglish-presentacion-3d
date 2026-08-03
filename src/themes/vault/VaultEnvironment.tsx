import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import type { ThemeEnvironmentProps } from '../types'

export function VaultEnvironment({ scene }: ThemeEnvironmentProps) {
  const config = scene.visualConfig
  const scene3d = useThree((state) => state.scene)

  useEffect(() => {
    const fogDensity = config?.fogDensity ?? 0.02
    scene3d.background = new THREE.Color('#0a0703')
    scene3d.fog = new THREE.FogExp2('#0d0903', fogDensity)
  }, [config?.fogDensity, scene3d])

  return (
    <>
      {/* Iluminación local: sin HDR externos para funcionar sin internet */}
      <hemisphereLight args={['#fde68a', '#1c1408', 0.45]} />
      <ambientLight intensity={0.22} color="#fbbf24" />
      <pointLight position={[0, 14, 0]} intensity={1.1} color="#f59e0b" distance={55} decay={2} />
      <pointLight position={[-12, 4, 10]} intensity={0.4} color="#ef4444" distance={35} decay={2} />
      <spotLight
        position={[0, 22, 6]}
        angle={0.5}
        penumbra={0.7}
        intensity={1.4}
        color="#fde68a"
        castShadow
      />
      {/* Piso metálico de la bóveda */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[45, 48]} />
        <meshStandardMaterial color="#1c1408" roughness={0.3} metalness={0.9} />
      </mesh>
    </>
  )
}
