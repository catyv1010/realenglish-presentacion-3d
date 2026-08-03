import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'

interface CinematicTitleProps {
  title: string
  subtitle?: string
  position?: [number, number, number]
  color?: string
  subtitleColor?: string
  delay?: number
  duration?: number
}

export function CinematicTitle({
  title,
  subtitle,
  position = [0, 6, 0],
  color = '#d946ef',
  subtitleColor = '#10b981',
  delay = 0,
  duration = 2.5,
}: CinematicTitleProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!groupRef.current) return
    const tl = gsap.timeline({ delay })
    tl.fromTo(
      groupRef.current.scale,
      { x: 0.5, y: 0.5, z: 0.5 },
      { x: 1, y: 1, z: 1, duration: duration * 0.5, ease: 'back.out(1.7)' }
    )
    tl.fromTo(
      groupRef.current.position,
      { y: position[1] - 1 },
      { y: position[1], duration: duration * 0.5, ease: 'power2.out' },
      '<'
    )
    tl.to(groupRef.current.scale, {
      x: 0.85,
      y: 0.85,
      z: 0.85,
      duration: duration * 0.4,
      ease: 'power2.inOut',
      onComplete: () => setVisible(false),
    })

    return () => {
      tl.kill()
    }
  }, [position, delay, duration])

  useFrame((state) => {
    if (!groupRef.current || !visible) return
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1
  })

  if (!visible) return null

  return (
    <group ref={groupRef} position={position} scale={0.5}>
      <Billboard>
        <Text fontSize={0.9} color={color} anchorX="center" anchorY="middle" letterSpacing={0.04} fontWeight={800}>
          {title}
        </Text>
        {subtitle && (
          <Text fontSize={0.28} color={subtitleColor} anchorX="center" anchorY="middle" position={[0, -0.9, 0]} letterSpacing={0.06}>
            {subtitle}
          </Text>
        )}
      </Billboard>
    </group>
  )
}
