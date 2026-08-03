import { useRef, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { CameraShake } from '../CameraShake'

interface SceneTransitionProps {
  duration?: number
  onComplete: () => void
}

export function SceneTransition({ duration = 0.8, onComplete }: SceneTransitionProps) {
  const flashRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const camera = useThree((state) => state.camera)

  const particleCount = 300
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30
    positions[i * 3 + 1] = (Math.random() - 0.5) * 30
    positions[i * 3 + 2] = (Math.random() - 0.5) * 15
  }

  useLayoutEffect(() => {
    if (!flashRef.current) return

    const tl = gsap.timeline({
      onComplete,
    })

    tl.fromTo(
      flashRef.current.material,
      { opacity: 0 },
      { opacity: 1, duration: duration * 0.25, ease: 'power2.in' }
    )
      .to(flashRef.current.material, {
        opacity: 0,
        duration: duration * 0.75,
        ease: 'power2.out',
      })

    return () => {
      tl.kill()
    }
  }, [duration, onComplete])

  useFrame(() => {
    if (!flashRef.current || !particlesRef.current) return
    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    const targetPosition = camera.position.clone().add(direction.multiplyScalar(2))
    flashRef.current.position.copy(targetPosition)
    flashRef.current.lookAt(camera.position)

    particlesRef.current.position.copy(targetPosition)
    const scale = particlesRef.current.scale.x + 0.08
    particlesRef.current.scale.setScalar(scale)
    particlesRef.current.rotation.z += 0.03
  })

  return (
    <>
      <CameraShake intensity={0.15} duration={duration} />
      <mesh ref={flashRef} scale={[25, 25, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} depthTest={false} />
      </mesh>
      <points ref={particlesRef} scale={[0.1, 0.1, 0.1]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial size={0.2} color="#22d3ee" transparent opacity={0.9} />
      </points>
    </>
  )
}
