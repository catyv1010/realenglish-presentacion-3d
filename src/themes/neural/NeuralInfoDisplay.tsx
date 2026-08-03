import { useRef, useLayoutEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'
import type { ThemeInfoDisplayProps } from '../types'

export function NeuralInfoDisplay({ scene }: ThemeInfoDisplayProps) {
  const groupRef = useRef<THREE.Group>(null)
  const camera = useThree((state) => state.camera)

  useFrame(() => {
    if (!groupRef.current) return
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    const target = camera.position.clone().add(direction.multiplyScalar(10)).add(new THREE.Vector3(0, 1.2, 0))
    groupRef.current.position.copy(target)
    groupRef.current.lookAt(camera.position)
  })

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0.1, y: 0.1, z: 0.1 },
      { x: 1, y: 1, z: 1, duration: 0.8, delay: 0.2, ease: 'back.out(1.7)' }
    )
  }, [scene.id])

  const bullets = useMemo(
    () => scene.content.split('\n').filter((line) => line.trim().length > 0),
    [scene.content]
  )

  const lineHeight = 0.48
  const bulletFontSize = 0.34
  const titleFontSize = 0.62
  const panelWidth = 14
  const titlePanelHeight = 1.6
  const contentPanelHeight = Math.max(1.8, bullets.length * lineHeight + 0.5)

  return (
    <group ref={groupRef} scale={[0.45, 0.45, 0.45]}>
      <Billboard>
        <mesh position={[0, 0.85, -0.06]} renderOrder={1000}>
          <planeGeometry args={[panelWidth + 0.2, titlePanelHeight + 0.2]} />
          <meshBasicMaterial color="#e879f9" transparent opacity={0.35} depthTest={false} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0.85, -0.05]} renderOrder={1001}>
          <planeGeometry args={[panelWidth, titlePanelHeight]} />
          <meshBasicMaterial color="#080214" transparent opacity={0.93} depthTest={false} depthWrite={false} />
        </mesh>
        <Text
          fontSize={titleFontSize}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#000000"
          letterSpacing={0.02}
          maxWidth={panelWidth - 0.6}
          renderOrder={1002}
        >
          {scene.title}
        </Text>
      </Billboard>

      <Billboard position={[0, -0.8 - contentPanelHeight / 2 + 0.9, 0]}>
        <mesh position={[0, 0, -0.06]} renderOrder={1000}>
          <planeGeometry args={[panelWidth + 0.2, contentPanelHeight + 0.2]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} depthTest={false} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, -0.05]} renderOrder={1001}>
          <planeGeometry args={[panelWidth, contentPanelHeight]} />
          <meshBasicMaterial color="#080214" transparent opacity={0.88} depthTest={false} depthWrite={false} />
        </mesh>

        {bullets.map((line, index) => {
          const y = (bullets.length - 1) * lineHeight * 0.5 - index * lineHeight
          return (
            <Text
              key={index}
              position={[0, y, 0]}
              fontSize={bulletFontSize}
              color="#ddd6fe"
              anchorX="center"
              anchorY="middle"
              maxWidth={panelWidth - 0.8}
              lineHeight={1.2}
              renderOrder={1002}
            >
              • {line}
            </Text>
          )
        })}
      </Billboard>
    </group>
  )
}
