import { useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import gsap from 'gsap'
import * as THREE from 'three'

interface DataTable3DProps {
  position?: [number, number, number]
  rows?: string[][]
  headers?: string[]
  color?: string
  entranceDelay?: number
}

export function DataTable3D({
  position = [0, 0, 0],
  rows = [],
  headers = [],
  color = '#06b6d4',
  entranceDelay = 0,
}: DataTable3DProps) {
  const groupRef = useRef<THREE.Group>(null)

  useLayoutEffect(() => {
    if (!groupRef.current) return
    gsap.fromTo(
      groupRef.current.scale,
      { x: 0, y: 0, z: 0 },
      {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.8,
        delay: entranceDelay,
        ease: 'back.out(1.7)',
      }
    )
  }, [entranceDelay])

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
  })

  const cellWidth = 2
  const cellHeight = 0.5
  const allRows = [headers, ...rows]

  return (
    <group ref={groupRef} position={position}>
      {allRows.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const x = (colIndex - row.length / 2 + 0.5) * cellWidth
          const y = (allRows.length / 2 - rowIndex - 0.5) * cellHeight
          const isHeader = rowIndex === 0
          return (
            <group key={`${rowIndex}-${colIndex}`} position={[x, y, 0]}>
              <mesh>
                <planeGeometry args={[cellWidth - 0.05, cellHeight - 0.05]} />
                <meshBasicMaterial
                  color={isHeader ? color : '#0f172a'}
                  transparent
                  opacity={isHeader ? 0.6 : 0.35}
                />
              </mesh>
              <Text
                position={[0, 0, 0.02]}
                fontSize={0.22}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                {cell}
              </Text>
            </group>
          )
        })
      )}
    </group>
  )
}
