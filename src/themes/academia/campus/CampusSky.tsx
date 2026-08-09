import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { QualityLevel } from '../../../types/presentation'

/**
 * El cielo del campus: una cupula con degradado de verdad, el sol con su halo,
 * rayos de luz cayendo en diagonal y una cordillera de volcanes al fondo.
 *
 * Antes el cielo era un color plano. Un color plano no tiene horizonte, y sin
 * horizonte la escena se ve como un dibujo pegado en una pared. El degradado
 * y los volcanes le dan al campus algo que antes no tenia: profundidad.
 */

const VERT = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = `
  uniform vec3 cenit;
  uniform vec3 horizonte;
  uniform vec3 tierra;
  uniform vec3 solDir;
  uniform vec3 solColor;
  varying vec3 vDir;

  void main() {
    float h = normalize(vDir).y;

    // De la tierra al horizonte al cenit, con la transicion suave.
    vec3 color = mix(horizonte, cenit, smoothstep(0.0, 0.55, h));
    color = mix(tierra, color, smoothstep(-0.12, 0.02, h));

    // Halo del sol: apretado y discreto. Un halo ancho le lava el color a todo
    // el cuadrante del sol y se come el fondo.
    float d = max(dot(normalize(vDir), normalize(solDir)), 0.0);
    color += solColor * pow(d, 90.0) * 0.55;
    color += solColor * pow(d, 14.0) * 0.07;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`

const DIR_SOL = new THREE.Vector3(42, 46, -70).normalize()

/** Rayos de sol: conos muy transparentes que caen desde el cielo. */
function RayosDeSol({ n }: { n: number }) {
  const grupo = useRef<THREE.Group>(null)

  const rayos = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        pos: [16 + ((i * 13) % 30), 24, -24 - ((i * 17) % 28)] as [number, number, number],
        escala: [2 + ((i * 5) % 3), 30, 2 + ((i * 7) % 3)] as [number, number, number],
        fase: i * 1.7,
      })),
    [n]
  )

  useFrame((state) => {
    if (!grupo.current) return
    const t = state.clock.elapsedTime
    grupo.current.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial
      // Muy tenue: siete conos superpuestos con mezcla aditiva se suman y, si
      // cada uno se ve, el resultado es una pared blanca en vez de un rayo.
      m.opacity = 0.016 + Math.sin(t * 0.35 + rayos[i % rayos.length].fase) * 0.008
    })
  })

  return (
    <group ref={grupo}>
      {rayos.map((r, i) => (
        <mesh key={`rayo-${i}`} position={r.pos} scale={r.escala} rotation={[0.34, 0, 0.28]}>
          <coneGeometry args={[1, 1, 6, 1, true]} />
          <meshBasicMaterial
            color="#fff3c4"
            transparent
            opacity={0.016}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/** La cordillera: siluetas de volcanes, cada fila mas clara que la anterior. */
function Volcanes() {
  const filas = useMemo(
    () => [
      { r: 150, color: '#7f9bb8', altura: 34, n: 7, desfase: 0 },
      { r: 195, color: '#95acc4', altura: 46, n: 6, desfase: 0.42 },
      { r: 245, color: '#aabdd2', altura: 58, n: 5, desfase: 0.85 },
    ],
    []
  )

  return (
    <group>
      {filas.map((f, fi) =>
        Array.from({ length: f.n }, (_, i) => {
          const a = ((i + f.desfase) / f.n) * Math.PI * 2 + fi * 0.3
          const alto = f.altura * (0.62 + ((i * 7) % 10) / 14)
          const ancho = alto * (0.95 + ((i * 5) % 8) / 12)
          return (
            <mesh key={`v-${fi}-${i}`} position={[Math.cos(a) * f.r, -4, Math.sin(a) * f.r]}>
              <coneGeometry args={[ancho, alto, 5]} />
              <meshBasicMaterial color={f.color} fog={false} />
            </mesh>
          )
        })
      )}
    </group>
  )
}

interface CampusSkyProps {
  quality: QualityLevel
}

export function CampusSky({ quality }: CampusSkyProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          cenit: { value: new THREE.Color('#6f9bea') },
          horizonte: { value: new THREE.Color('#dfe9ff') },
          tierra: { value: new THREE.Color('#cfe0c8') },
          solDir: { value: DIR_SOL.clone() },
          solColor: { value: new THREE.Color('#ffe9a3') },
        },
      }),
    []
  )

  const nRayos = quality === 'high' ? 7 : quality === 'medium' ? 4 : 0

  return (
    <group>
      <mesh material={material} renderOrder={-1000}>
        <sphereGeometry args={[300, 32, 24]} />
      </mesh>

      <Volcanes />

      {/* El sol, ya con el halo pintado por el shader del cielo */}
      <mesh position={[42, 46, -70]}>
        <sphereGeometry args={[4.5, 24, 24]} />
        <meshBasicMaterial color="#fff6d8" fog={false} />
      </mesh>

      {nRayos > 0 && <RayosDeSol n={nRayos} />}
    </group>
  )
}
