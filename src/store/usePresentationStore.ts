import { create } from 'zustand'
import type { NavigationMode, Presentation, QualityLevel, Scene } from '../types/presentation'
import realenglishPresentation from '../data/realenglish-presentation.json'

export type PresentationId = 'realenglish'

interface PresentationState {
  currentSceneIndex: number
  scenes: Scene[]
  currentPresentationId: PresentationId
  navigationMode: NavigationMode
  quality: QualityLevel
  isPlaying: boolean
  panelOpen: boolean
  hudOpen: boolean
}

interface PresentationActions {
  goToScene: (index: number) => void
  nextScene: () => void
  prevScene: () => void
  toggleAutoPlay: () => void
  setQuality: (quality: QualityLevel) => void
  setNavigationMode: (mode: NavigationMode) => void
  togglePanel: () => void
  toggleHud: () => void
  loadPresentation: (id: PresentationId) => void
}

const presentations: Record<PresentationId, Presentation> = {
  realenglish: realenglishPresentation as unknown as Presentation,
}

export const presentationNames: Record<PresentationId, string> = {
  realenglish: 'Real English CR — SC-504',
}

// Enlaces directos: ?scene=5&q=low abre esa escena con esa calidad
const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
const initialPresentationId: PresentationId = 'realenglish'
const initialSceneParam = Number(urlParams.get('scene'))
const initialSceneIndex = Number.isFinite(initialSceneParam) && urlParams.get('scene') !== null
  ? Math.max(0, Math.min(initialSceneParam, presentations[initialPresentationId].scenes.length - 1))
  : 0
const urlQuality = urlParams.get('q') as QualityLevel | null
const initialQuality: QualityLevel = urlQuality && ['low', 'medium', 'high'].includes(urlQuality) ? urlQuality : 'high'

export const usePresentationStore = create<PresentationState & PresentationActions>(
  (set, get) => ({
    currentSceneIndex: initialSceneIndex,
    scenes: presentations[initialPresentationId].scenes as unknown as Scene[],
    currentPresentationId: initialPresentationId,
    navigationMode: 'manual',
    quality: initialQuality,
    isPlaying: false,
    panelOpen: true,
    hudOpen: false,

    loadPresentation: (id: PresentationId) => {
      const presentation = presentations[id]
      if (!presentation) return
      set({
        currentPresentationId: id,
        scenes: presentation.scenes as unknown as Scene[],
        currentSceneIndex: 0,
        isPlaying: false,
      })
    },

    goToScene: (index: number) => {
      const { scenes } = get()
      const clampedIndex = Math.max(0, Math.min(index, scenes.length - 1))
      set({ currentSceneIndex: clampedIndex })
    },

    nextScene: () => {
      const { currentSceneIndex, scenes } = get()
      if (currentSceneIndex < scenes.length - 1) {
        set({ currentSceneIndex: currentSceneIndex + 1 })
      }
    },

    prevScene: () => {
      const { currentSceneIndex } = get()
      if (currentSceneIndex > 0) {
        set({ currentSceneIndex: currentSceneIndex - 1 })
      }
    },

    toggleAutoPlay: () => {
      set((state) => ({ isPlaying: !state.isPlaying }))
    },

    setQuality: (quality: QualityLevel) => {
      set({ quality })
    },

    setNavigationMode: (mode: NavigationMode) => {
      set({ navigationMode: mode })
    },

    togglePanel: () => {
      set((state) => ({ panelOpen: !state.panelOpen }))
    },

    toggleHud: () => {
      set((state) => ({ hudOpen: !state.hudOpen }))
    },
  })
)
