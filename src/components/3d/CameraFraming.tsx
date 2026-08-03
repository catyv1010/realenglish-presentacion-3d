import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePresentationStore } from '../../store/usePresentationStore'

/**
 * Desplaza el encuadre de la cámara para que el mundo 3D quede a la derecha
 * (despejado del panel de texto) y un poco más abajo. Al hacer zoom con la
 * rueda el mundo se mantiene centrado en ese espacio libre.
 */
export function CameraFraming() {
  const camera = useThree((state) => state.camera) as THREE.PerspectiveCamera
  const size = useThree((state) => state.size)
  const panelOpen = usePresentationStore((state) => state.panelOpen)

  useEffect(() => {
    const w = size.width
    const h = size.height
    const panelW = Math.min(720, w * 0.47)
    // x negativo desplaza el contenido hacia la derecha; y negativo, hacia abajo
    const shiftX = panelOpen && w > 900 ? -panelW / 2 : 0
    const shiftY = -h * 0.12
    camera.setViewOffset(w, h, shiftX, shiftY, w, h)
    return () => {
      camera.clearViewOffset()
    }
  }, [camera, size.width, size.height, panelOpen])

  return null
}
