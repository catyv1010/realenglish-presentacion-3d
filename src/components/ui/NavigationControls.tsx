import { useEffect } from 'react'
import { usePresentationStore } from '../../store/usePresentationStore'
import { presentationNames, type PresentationId } from '../../store/usePresentationStore'
import { useAudioStore } from '../../store/useAudioStore'
import type { NavigationMode, QualityLevel } from '../../types/presentation'

export function NavigationControls() {
  const currentSceneIndex = usePresentationStore((state) => state.currentSceneIndex)
  const scenes = usePresentationStore((state) => state.scenes)
  const navigationMode = usePresentationStore((state) => state.navigationMode)
  const quality = usePresentationStore((state) => state.quality)
  const isPlaying = usePresentationStore((state) => state.isPlaying)
  const hudOpen = usePresentationStore((state) => state.hudOpen)
  const goToScene = usePresentationStore((state) => state.goToScene)
  const nextScene = usePresentationStore((state) => state.nextScene)
  const prevScene = usePresentationStore((state) => state.prevScene)
  const toggleAutoPlay = usePresentationStore((state) => state.toggleAutoPlay)
  const setQuality = usePresentationStore((state) => state.setQuality)
  const setNavigationMode = usePresentationStore((state) => state.setNavigationMode)
  const toggleHud = usePresentationStore((state) => state.toggleHud)
  const currentPresentationId = usePresentationStore((state) => state.currentPresentationId)
  const loadPresentation = usePresentationStore((state) => state.loadPresentation)

  const sceneCount = scenes.length
  const isFirstScene = currentSceneIndex === 0
  const isLastScene = currentSceneIndex === sceneCount - 1
  const progress = ((currentSceneIndex + 1) / sceneCount) * 100
  const currentScene = scenes[currentSceneIndex]
  const themeName = currentScene?.visualConfig?.theme ?? currentScene?.environment ?? 'cyberpunk'

  // Navegación con el teclado: ← → (y AvPág/RePág del presentador)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault()
        nextScene()
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        prevScene()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextScene, prevScene])

  const handleModeChange = (mode: NavigationMode) => {
    setNavigationMode(mode)
    if (mode !== 'auto') {
      if (isPlaying) toggleAutoPlay()
    }
  }

  const handleQualityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setQuality(event.target.value as QualityLevel)
  }

  const handlePresentationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    loadPresentation(event.target.value as PresentationId)
  }

  const audioIsPlaying = useAudioStore((state) => state.isPlaying)
  const volume = useAudioStore((state) => state.volume)
  const isMuted = useAudioStore((state) => state.isMuted)
  const audioToggle = useAudioStore((state) => state.toggle)
  const audioInit = useAudioStore((state) => state.init)
  const setVolume = useAudioStore((state) => state.setVolume)
  const toggleMute = useAudioStore((state) => state.toggleMute)

  const handleAudioToggle = () => {
    audioInit()
    audioToggle()
  }

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(event.target.value))
  }

  return (
    <>
      {/* Tira de progreso fija al fondo de la pantalla */}
      <div className="cinematic-progress">
        <div className="cinematic-progress-fill" style={{ width: `${progress}%` }} />
        <div className="cinematic-progress-glow" style={{ left: `${progress}%` }} />
      </div>

      {/* Mini-barra: flechas + contador + botón de menú */}
      <div className="hud-mini">
        <button
          type="button"
          className="hud-arrow"
          onClick={prevScene}
          disabled={isFirstScene}
          aria-label="Escena anterior"
        >
          ❮
        </button>
        <span className="hud-counter">
          {currentSceneIndex + 1} / {sceneCount}
        </span>
        <button
          type="button"
          className="hud-arrow hud-arrow-next"
          onClick={nextScene}
          disabled={isLastScene}
          aria-label="Escena siguiente"
        >
          ❯
        </button>
        <button
          type="button"
          className="hud-menu-toggle"
          onClick={toggleHud}
          aria-label={hudOpen ? 'Ocultar menú' : 'Mostrar menú'}
        >
          {hudOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Menú completo (oculto por defecto) */}
      {hudOpen && (
        <div className="navigation-controls">
          <div className="navigation-section">
            <div className="scene-info">
              <span className="scene-title">{currentScene?.title}</span>
              <span className="progress-indicator">
                Escena {currentSceneIndex + 1} de {sceneCount}
              </span>
              <span className="theme-badge">{themeName}</span>
            </div>
          </div>

          <div className="navigation-section">
            <div className="mode-toggle">
              <button
                type="button"
                onClick={() => handleModeChange('manual')}
                className={navigationMode === 'manual' ? 'active' : ''}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('auto')}
                className={navigationMode === 'auto' ? 'active' : ''}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('free')}
                className={navigationMode === 'free' ? 'active' : ''}
              >
                Libre
              </button>
            </div>

            <button
              type="button"
              onClick={toggleAutoPlay}
              disabled={navigationMode !== 'auto'}
              className="play-button"
            >
              {isPlaying ? 'Pausar' : 'Reproducir'}
            </button>

            <label className="quality-selector">
              Calidad:
              <select value={quality} onChange={handleQualityChange}>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </label>

            <label className="quality-selector">
              Presentación:
              <select value={currentPresentationId} onChange={handlePresentationChange}>
                {Object.entries(presentationNames).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="navigation-section">
            <button
              type="button"
              onClick={handleAudioToggle}
              className="audio-button"
            >
              {audioIsPlaying ? '🔊 Audio On' : '🔇 Audio Off'}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              disabled={!audioIsPlaying}
              className="audio-button"
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>

            <label className="volume-slider">
              Volumen:
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                disabled={!audioIsPlaying}
              />
            </label>
          </div>

          <div className="navigation-section scene-dots">
            {scenes.map((scene, index) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => goToScene(index)}
                className={`scene-dot ${index === currentSceneIndex ? 'active' : ''}`}
                aria-label={`Ir a escena ${index + 1}: ${scene.title}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
