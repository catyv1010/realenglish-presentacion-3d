import { create } from 'zustand'
import { AudioEngine, type AudioAnalysisData } from '../audio/AudioEngine'

interface AudioState {
  engine: AudioEngine | null
  isPlaying: boolean
  volume: number
  isMuted: boolean
  analysis: AudioAnalysisData
}

interface AudioActions {
  init: () => void
  play: () => void
  pause: () => void
  toggle: () => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setAnalysis: (analysis: AudioAnalysisData) => void
}

export const useAudioStore = create<AudioState & AudioActions>((set, get) => ({
  engine: null,
  isPlaying: false,
  volume: 0.4,
  isMuted: false,
  analysis: { bass: 0, mid: 0, high: 0, average: 0 },

  init: () => {
    const { engine } = get()
    if (engine) return

    const newEngine = new AudioEngine()
    newEngine.setVolume(get().volume)
    set({ engine: newEngine })
  },

  play: () => {
    const { engine } = get()
    if (!engine) {
      get().init()
      get().play()
      return
    }
    engine.resume().then(() => {
      engine.play()
      set({ isPlaying: true })
    })
  },

  pause: () => {
    const { engine } = get()
    if (!engine) return
    engine.pause()
    set({ isPlaying: false })
  },

  toggle: () => {
    const { isPlaying } = get()
    if (isPlaying) {
      get().pause()
    } else {
      get().play()
    }
  },

  setVolume: (volume: number) => {
    const { engine, isMuted } = get()
    const clampedVolume = Math.max(0, Math.min(1, volume))
    if (engine) {
      engine.setVolume(isMuted ? 0 : clampedVolume)
    }
    set({ volume: clampedVolume })
  },

  toggleMute: () => {
    const { engine, volume, isMuted } = get()
    const newMuted = !isMuted
    if (engine) {
      engine.setVolume(newMuted ? 0 : volume)
    }
    set({ isMuted: newMuted })
  },

  setAnalysis: (analysis: AudioAnalysisData) => {
    set({ analysis })
  },
}))
