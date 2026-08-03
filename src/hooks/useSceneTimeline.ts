import { useEffect, useRef, useCallback, useState } from 'react'
import gsap from 'gsap'
import * as THREE from 'three'
import type { Scene, CameraKeyframe } from '../types/presentation'

interface UseSceneTimelineOptions {
  scene: Scene
  camera: THREE.PerspectiveCamera | null
  controlsTarget: { x: number; y: number; z: number } | null
  autoPlay?: boolean
  onComplete?: () => void
}

interface UseSceneTimelineReturn {
  play: () => void
  pause: () => void
  restart: () => void
  seek: (progress: number) => void
  progress: number
  duration: number
  isPlaying: boolean
}

export function useSceneTimeline({
  scene,
  camera,
  controlsTarget,
  autoPlay = false,
  onComplete,
}: UseSceneTimelineOptions): UseSceneTimelineReturn {
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)

  const buildTimeline = useCallback(() => {
    if (!camera) return null

    const tl = gsap.timeline({
      paused: true,
      onUpdate: () => {
        setProgress(tl.progress())
      },
      onComplete: () => {
        setIsPlaying(false)
        onComplete?.()
      },
      onStart: () => {
        setIsPlaying(true)
      },
    })

    const keyframes = scene.visualConfig?.cameraPath

    if (keyframes && keyframes.length > 0) {
      // Animate through camera path keyframes
      keyframes.forEach((keyframe: CameraKeyframe, index: number) => {
        const [px, py, pz] = keyframe.position
        const [tx, ty, tz] = keyframe.target
        const ease = keyframe.ease ?? 'power2.inOut'

        if (index === 0) {
          // Set initial camera position instantly
          camera.position.set(px, py, pz)
          if (controlsTarget) {
            gsap.set(controlsTarget, { x: tx, y: ty, z: tz })
          }
        }

        const positionTween = gsap.to(camera.position, {
          x: px,
          y: py,
          z: pz,
          duration: keyframe.duration,
          ease,
        })

        tl.add(positionTween, index === 0 ? 0 : '>')

        if (controlsTarget) {
          const targetTween = gsap.to(controlsTarget, {
            x: tx,
            y: ty,
            z: tz,
            duration: keyframe.duration,
            ease,
          })
          tl.add(targetTween, '<')
        }

        if (keyframe.hold && keyframe.hold > 0) {
          tl.to({}, { duration: keyframe.hold })
        }
      })
    } else {
      // Fallback to single cameraPosition/cameraTarget
      const [px, py, pz] = scene.cameraPosition
      const [tx, ty, tz] = scene.cameraTarget

      camera.position.set(px, py, pz)
      if (controlsTarget) {
        gsap.set(controlsTarget, { x: tx, y: ty, z: tz })
      }

      tl.to(camera.position, { x: px, y: py, z: pz, duration: 0 })
      if (controlsTarget) {
        tl.to(controlsTarget, { x: tx, y: ty, z: tz, duration: 0 }, '<')
      }
    }

    return tl
  }, [scene, camera, controlsTarget, onComplete])

  useEffect(() => {
    const tl = buildTimeline()
    if (!tl) return

    timelineRef.current = tl
    setDuration(tl.duration())
    setProgress(0)

    if (autoPlay) {
      tl.play()
    } else {
      tl.progress(1)
    }

    return () => {
      tl.kill()
      timelineRef.current = null
    }
  }, [buildTimeline, autoPlay])

  const play = useCallback(() => {
    timelineRef.current?.play()
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    timelineRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const restart = useCallback(() => {
    timelineRef.current?.restart()
    setIsPlaying(true)
  }, [])

  const seek = useCallback((value: number) => {
    timelineRef.current?.progress(value)
    setProgress(value)
  }, [])

  return {
    play,
    pause,
    restart,
    seek,
    progress,
    duration,
    isPlaying,
  }
}
