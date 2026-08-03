import { useEffect } from 'react'
import { usePresentationStore } from '../store/usePresentationStore'
import { useAudioStore } from '../store/useAudioStore'

const AUTOPLAY_INTERVAL_MS = 6000

export function useAutoPlay() {
  const isPlaying = usePresentationStore((state) => state.isPlaying)
  const navigationMode = usePresentationStore((state) => state.navigationMode)
  const nextScene = usePresentationStore((state) => state.nextScene)
  const currentSceneIndex = usePresentationStore((state) => state.currentSceneIndex)
  const scenes = usePresentationStore((state) => state.scenes)
  const audioToggle = useAudioStore((state) => state.toggle)
  const initAudio = useAudioStore((state) => state.init)

  useEffect(() => {
    if (navigationMode === 'auto' && isPlaying) {
      initAudio()
      audioToggle()
    }
  }, [navigationMode, isPlaying, initAudio, audioToggle])

  useEffect(() => {
    if (!isPlaying || navigationMode !== 'auto') return

    const intervalId = window.setInterval(() => {
      if (currentSceneIndex >= scenes.length - 1) {
        usePresentationStore.setState({ isPlaying: false })
        return
      }
      nextScene()
    }, AUTOPLAY_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isPlaying, navigationMode, nextScene, currentSceneIndex, scenes.length])
}
