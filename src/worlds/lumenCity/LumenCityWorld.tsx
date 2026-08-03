import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Grid, Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import type { Scene } from '../../types/presentation'
import type { WorldProps } from '../types'
import { usePresentationStore } from '../../store/usePresentationStore'
import { Plaza } from './Plaza'
import { SourceTower } from './SourceTower'
import { ExternalObservatory } from './ExternalObservatory'
import { WarehouseTower } from './WarehouseTower'
import { ETLBridge } from './ETLBridge'
import { KPIObservatory } from './KPIObservatory'
import { CityParticles } from './CityParticles'

const BG = '#0a0f1e'
const FOG_DENSITY = 0.012

interface CityCameraProps {
  scene: Scene
}

function CityCamera({ scene }: CityCameraProps) {
  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera)
  const navigationMode = usePresentationStore((state) => state.navigationMode)
  const targetPosition = useMemo(() => new THREE.Vector3(...scene.cameraPosition), [scene.cameraPosition])
  const targetLookAt = useMemo(() => new THREE.Vector3(...scene.cameraTarget), [scene.cameraTarget])
  const speed = useRef(0.035)

  useFrame((state) => {
    if (navigationMode === 'free') return
    const controls = state.controls as unknown as { target: THREE.Vector3; update: () => void } | null
    camera.position.lerp(targetPosition, speed.current)
    if (controls) {
      controls.target.lerp(targetLookAt, speed.current)
      controls.update()
    } else {
      camera.lookAt(targetLookAt)
    }
  })

  return null
}

function CityFloor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#0b1221" roughness={0.35} metalness={0.55} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[240, 240]}
        cellSize={2}
        cellThickness={0.4}
        cellColor="#1e293b"
        sectionSize={12}
        sectionThickness={0.8}
        sectionColor="#334155"
        fadeDistance={90}
        fadeStrength={1.2}
        infiniteGrid
      />
    </>
  )
}

function WorldTitle() {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = 5.6 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08
    }
  })
  return (
    <Billboard ref={groupRef} position={[0, 5.6, 0]}>
      <Text fontSize={0.55} color="#f8fafc" anchorX="center" anchorY="middle" letterSpacing={0.08}>
        LUMEN HEALTH
      </Text>
      <Text fontSize={0.22} color="#22d3ee" anchorX="center" anchorY="middle" position={[0, -0.55, 0]} letterSpacing={0.04}>
        CIUDAD DE LA MENTE Y LOS DATOS
      </Text>
    </Billboard>
  )
}

export function LumenCityWorld({ scene, quality }: WorldProps) {
  const config = scene.visualConfig
  const { scene: scene3d } = useThree()

  const particleCount = useMemo(() => {
    switch (quality) {
      case 'low':
        return 40
      case 'medium':
        return 80
      default:
        return 140
    }
  }, [quality])

  useEffect(() => {
    scene3d.background = new THREE.Color(config?.backgroundColor ?? BG)
    scene3d.fog = new THREE.FogExp2(config?.backgroundColor ?? BG, config?.fogDensity ?? FOG_DENSITY)
    return () => {
      scene3d.background = new THREE.Color(BG)
      scene3d.fog = null
    }
  }, [scene3d, config?.backgroundColor, config?.fogDensity])

  return (
    <>
      <CityCamera scene={scene} />

      <ambientLight intensity={0.35} color="#6366f1" />
      <hemisphereLight intensity={0.28} color="#8b5cf6" groundColor="#0f172a" />
      <directionalLight
        position={[18, 32, 18]}
        intensity={1.3}
        color="#e2e8f0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
      />
      <spotLight position={[0, 20, -10]} angle={0.6} penumbra={0.5} intensity={0.8} color="#06b6d4" distance={60} decay={2} />

      <CityFloor />
      <Plaza />
      <WorldTitle />

      {/* Fuentes internas: 4 distritos */}
      <SourceTower label="Citas" position={[-9, 0, -5]} color="#22d3ee" accent="#0891b2" height={9} quality={quality} />
      <SourceTower label="Profesionales" position={[-4, 0, -11]} color="#818cf8" accent="#4f46e5" height={8} quality={quality} />
      <SourceTower label="Productos" position={[4, 0, -11]} color="#c084fc" accent="#9333ea" height={7.5} quality={quality} />
      <SourceTower label="Contable" position={[9, 0, -5]} color="#f472b6" accent="#db2777" height={7} quality={quality} />

      {/* Fuentes externas: 3 observatorios */}
      <ExternalObservatory label="OMS" position={[-14, 0, 6]} color="#10b981" beamColor="#34d399" />
      <ExternalObservatory label="Ministerio" position={[-10, 0, 13]} color="#10b981" beamColor="#34d399" />
      <ExternalObservatory label="INEC" position={[-4, 0, 16]} color="#10b981" beamColor="#34d399" />

      {/* Data Warehouse central */}
      <WarehouseTower position={[0, 0, 10]} quality={quality} />

      {/* Canales ETL desde fuentes internas/externas hacia el DW */}
      <ETLBridge
        from={[-9, 4.5, -5]}
        to={[0, 7, 10]}
        color="#f59e0b"
        quality={quality}
      />
      <ETLBridge
        from={[-4, 4, -11]}
        to={[0, 7, 10]}
        color="#f59e0b"
        quality={quality}
      />
      <ETLBridge
        from={[-10, 4, 13]}
        to={[0, 7, 10]}
        color="#f59e0b"
        quality={quality}
      />

      {/* Observatorio de KPIs */}
      <KPIObservatory position={[12, 0, 2]} quality={quality} />

      {/* Partículas ambientales */}
      <CityParticles count={particleCount} />

      {/* Etiqueta del mundo */}
      <Billboard position={[0, 0.25, 8]}>
        <Text fontSize={0.18} color="#94a3b8" anchorX="center" anchorY="middle">
          {scene.world ?? 'Ciudad de la Mente'}
        </Text>
      </Billboard>
    </>
  )
}
