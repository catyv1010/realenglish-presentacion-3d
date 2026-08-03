import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface MarineParticlesProps {
  count: number
  ext: { x: number; z: number; y0: number; y1: number }
  size: number
  color: string
  opacity: number
  riseSpeed: number
  soft?: boolean
}

function createParticleTexture(soft: boolean) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  if (soft) {
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.32, 'rgba(255,255,255,.5)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
  } else {
    grad.addColorStop(0, 'rgba(255,255,255,.04)')
    grad.addColorStop(0.74, 'rgba(255,255,255,.35)')
    grad.addColorStop(0.93, 'rgba(255,255,255,.8)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
  }
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function MarineParticles({ count, ext, size, color, opacity, riseSpeed, soft = true }: MarineParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)

  const { geometry, material } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 2 * ext.x
      pos[i * 3 + 1] = ext.y0 + Math.random() * (ext.y1 - ext.y0)
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2 * ext.z * 0.65
      seed[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMap: { value: createParticleTexture(soft) },
        uColor: { value: new THREE.Color(color) },
        uSize: { value: size },
        uOpac: { value: opacity },
        uSub: { value: riseSpeed },
      },
      vertexShader: `
        attribute float aSeed;
        uniform float uTime, uSize, uSub;
        varying float vS;
        void main() {
          vS = aSeed;
          vec3 p = position;
          float period = ${(ext.y1 - ext.y0 + 10).toFixed(1)};
          p.y = mod(p.y + uTime * (0.3 + aSeed * 1.1) * uSub + aSeed * 40.0, period) + ${ext.y0.toFixed(1)};
          p.x += sin(uTime * 0.28 + aSeed * 31.0) * 1.4;
          p.z += cos(uTime * 0.22 + aSeed * 17.0) * 1.4;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = min(uSize * (1.0 + aSeed * 1.4) * (55.0 / -mv.z), 34.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        uniform vec3 uColor;
        uniform float uOpac;
        varying float vS;
        void main() {
          vec4 t = texture2D(uMap, gl_PointCoord);
          if (t.a < 0.02) discard;
          gl_FragColor = vec4(uColor * (0.7 + vS * 0.55), t.a * uOpac);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
    return { geometry: geo, material: mat }
  }, [count, ext, size, color, opacity, riseSpeed, soft])

  useFrame((state) => {
    if (pointsRef.current) {
      ;(pointsRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}
