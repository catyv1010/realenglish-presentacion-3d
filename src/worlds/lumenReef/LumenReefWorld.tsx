import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Scene } from '../../types/presentation'
import type { WorldProps } from '../types'
import { usePresentationStore } from '../../store/usePresentationStore'
import { ReefEnvironment } from './ReefEnvironment'
import { CoralPlaza } from './CoralPlaza'
import { Spring } from './Spring'
import { ETLFilter } from './ETLFilter'
import { LumaGuide } from './LumaGuide'

interface ReefCameraProps {
  scene: Scene
}

function ReefCamera({ scene }: ReefCameraProps) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera)
  const navigationMode = usePresentationStore((state) => state.navigationMode)
  const targetPosition = useMemo(() => new THREE.Vector3(...scene.cameraPosition), [scene.cameraPosition])
  const targetLookAt = useMemo(() => new THREE.Vector3(...scene.cameraTarget), [scene.cameraTarget])
  const speed = useMemo(() => 0.028, [])

  useFrame((state) => {
    if (navigationMode === 'free') return
    const controls = state.controls as unknown as { target: THREE.Vector3; update: () => void } | null
    camera.position.lerp(targetPosition, speed)
    if (controls) {
      controls.target.lerp(targetLookAt, speed)
      controls.update()
    } else {
      camera.lookAt(targetLookAt)
    }
  })

  return null
}

export function LumenReefWorld({ scene, quality }: WorldProps) {
  return (
    <>
      <ReefCamera scene={scene} />

      <ReefEnvironment quality={quality} />

      <CoralPlaza />

      {/* Manantiales internos */}
      <Spring
        label="Citas"
        description="Sistema transaccional: registros de citas, pagos, suscripciones y atenciones."
        position={[-12, 0, -10]}
        color="#22d3ee"
        accent="#0891b2"
        quality={quality}
        type="citas"
      />
      <Spring
        label="Profesionales"
        description="Gestión de psicólogos, especialidades, horarios y disponibilidad."
        position={[12, 0, -10]}
        color="#818cf8"
        accent="#4f46e5"
        quality={quality}
        type="profesionales"
      />

      {/* Sistema de filtros ETL */}
      <ETLFilter position={[0, 0, 14]} quality={quality} />

      {/* Guía Luma */}
      <LumaGuide position={[5, 3.2, 5]} />

      {/* Iluminación ambiental adicional del arrecife */}
      <pointLight position={[-8, 4, -6]} color="#22d3ee" intensity={3.5} distance={16} decay={2} />
      <pointLight position={[8, 4, -6]} color="#818cf8" intensity={3.5} distance={16} decay={2} />
      <pointLight position={[0, 3, 14]} color="#2dd4bf" intensity={4} distance={18} decay={2} />
    </>
  )
}
