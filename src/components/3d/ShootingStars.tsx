import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Comet {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  delay: number
}

const COMET_COLORS = ['#a5f3fc', '#fde68a', '#e9d5ff', '#ffffff']

function spawnComet(comet: Comet) {
  // Franja del cielo que la cámara sí ve (mira hacia el origen desde z ~16-28)
  comet.position.set(
    (Math.random() - 0.5) * 80,
    14 + Math.random() * 14,
    -12 - Math.random() * 26
  )
  const speed = 16 + Math.random() * 12
  comet.velocity.set(
    (Math.random() > 0.5 ? 1 : -1) * speed,
    -speed * (0.22 + Math.random() * 0.28),
    0
  )
  comet.maxLife = 1.8 + Math.random() * 1.6
  comet.life = comet.maxLife
  comet.delay = Math.random() * 2.5
}

/**
 * Lluvia de estrellas: cometas que cruzan el cielo de todas las escenas.
 * Los materiales llevan fog={false} para que la niebla de cada mundo
 * no los oculte.
 */
export function ShootingStars({ count = 8 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  const comets = useMemo(() => {
    return Array.from({ length: count }, () => {
      const comet: Comet = {
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        delay: 0,
      }
      spawnComet(comet)
      comet.delay = Math.random() * 4
      return comet
    })
  }, [count])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      const comet = comets[i]
      if (comet.delay > 0) {
        comet.delay -= delta
        child.visible = false
        return
      }
      comet.life -= delta
      if (comet.life <= 0) {
        spawnComet(comet)
        return
      }
      child.visible = true
      comet.position.addScaledVector(comet.velocity, delta)
      child.position.copy(comet.position)
      // Orientar la cola en la dirección del vuelo
      child.rotation.z = Math.atan2(comet.velocity.y, comet.velocity.x)
      // Desvanecer al inicio y al final de la vida
      const t = comet.life / comet.maxLife
      const fade = Math.min(1, Math.min((1 - t) * 6, t * 3))
      const head = (child as THREE.Group).children[0] as THREE.Mesh
      const tail = (child as THREE.Group).children[1] as THREE.Mesh
      ;(head.material as THREE.MeshBasicMaterial).opacity = fade
      ;(tail.material as THREE.MeshBasicMaterial).opacity = fade * 0.6
    })
  })

  return (
    <group ref={groupRef}>
      {comets.map((_, i) => (
        <group key={i} visible={false}>
          {/* Cabeza brillante */}
          <mesh>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshBasicMaterial color="#ffffff" transparent toneMapped={false} fog={false} />
          </mesh>
          {/* Cola luminosa */}
          <mesh position={[-3.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.11, 6.4, 6]} />
            <meshBasicMaterial
              color={COMET_COLORS[i % COMET_COLORS.length]}
              transparent
              toneMapped={false}
              fog={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
