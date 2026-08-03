import { useEffect } from 'react'
import { useAudioStore } from '../store/useAudioStore'

export function useAudioAnalysis() {
  const engine = useAudioStore((state) => state.engine)
  const isPlaying = useAudioStore((state) => state.isPlaying)
  const setAnalysis = useAudioStore((state) => state.setAnalysis)

  useEffect(() => {
    if (!engine || !isPlaying) return

    let animationFrameId: number

    const updateAnalysis = () => {
      const data = engine.getAnalysis()
      setAnalysis(data)
      animationFrameId = requestAnimationFrame(updateAnalysis)
    }

    animationFrameId = requestAnimationFrame(updateAnalysis)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [engine, isPlaying, setAnalysis])
}
