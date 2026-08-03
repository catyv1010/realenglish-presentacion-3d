import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { usePresentationStore } from '../../store/usePresentationStore'
import { useSceneTimeline } from '../../hooks/useSceneTimeline'
import { CityScene } from './CityScene'
import { CinematicCamera } from './CinematicCamera'
import { AudioReactiveCamera } from './AudioReactiveCamera'
import { SceneTransition } from './transitions/SceneTransition'

export function SceneController() {
  const currentSceneIndex = usePresentationStore((state) => state.currentSceneIndex)
  const scenes = usePresentationStore((state) => state.scenes)
  const navigationMode = usePresentationStore((state) => state.navigationMode)
  const isPlayingStore = usePresentationStore((state) => state.isPlaying)
  const nextScene = usePresentationStore((state) => state.nextScene)
  const toggleAutoPlay = usePresentationStore((state) => state.toggleAutoPlay)

  const camera = useThree((state) => state.camera as THREE.PerspectiveCamera)
  const controls = useThree((state) => state.controls)

  const currentScene = scenes[currentSceneIndex]
  const previousSceneIndex = useRef(currentSceneIndex)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const controlsTarget =
    controls && 'target' in controls
      ? (controls as { target: { x: number; y: number; z: number } }).target
      : null

  const autoPlay = navigationMode === 'auto' && isPlayingStore

  const { play, pause, restart, isPlaying } = useSceneTimeline({
    scene: currentScene,
    camera,
    controlsTarget,
    autoPlay: false,
    onComplete: () => {
      if (navigationMode === 'auto' && currentSceneIndex < scenes.length - 1) {
        setIsTransitioning(true)
      } else if (navigationMode === 'auto' && currentSceneIndex >= scenes.length - 1) {
        toggleAutoPlay()
      }
    },
  })

  // Handle scene changes and autoplay state
  useEffect(() => {
    const sceneChanged = previousSceneIndex.current !== currentSceneIndex
    previousSceneIndex.current = currentSceneIndex

    if (sceneChanged) {
      setIsTransitioning(false)
      if (autoPlay) {
        // Small delay to allow scene mount
        const timeoutId = window.setTimeout(() => restart(), 100)
        return () => window.clearTimeout(timeoutId)
      }
    } else if (autoPlay && !isPlaying && !isTransitioning) {
      play()
    } else if (!autoPlay && isPlaying) {
      pause()
    }
  }, [currentSceneIndex, autoPlay, isPlaying, isTransitioning, play, pause, restart])

  const handleTransitionComplete = () => {
    setIsTransitioning(false)
    nextScene()
  }

  if (!currentScene) {
    return null
  }

  return (
    <>
      <CinematicCamera enabled={navigationMode === 'auto' && isPlayingStore} />
      {navigationMode === 'auto' && isPlayingStore && <AudioReactiveCamera />}
      <CityScene scene={currentScene} />
      {isTransitioning && <SceneTransition onComplete={handleTransitionComplete} />}
    </>
  )
}
