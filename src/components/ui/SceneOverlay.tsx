import { useState, useEffect } from 'react'
import { usePresentationStore } from '../../store/usePresentationStore'
import { getTheme } from '../../themes/registry'

const themeAccent: Record<string, string> = {
  cyberpunk: '#22d3ee',
  neural: '#e879f9',
  cosmos: '#facc15',
  hospital: '#38bdf8',
  vault: '#fbbf24',
  datacenter: '#34d399',
  control: '#7dd3fc',
  museum: '#d4a373',
  'lumen-voyage': '#5ff2ff',
  canopy: '#34d399',
  academia: '#525fe1',
}

// Temas de mundos claros: el panel usa fondo blanco y texto oscuro
const LIGHT_THEMES = new Set(['academia'])

export function SceneOverlay() {
  const scenes = usePresentationStore((state) => state.scenes)
  const currentSceneIndex = usePresentationStore((state) => state.currentSceneIndex)
  const scene = scenes[currentSceneIndex]
  const panelOpen = usePresentationStore((state) => state.panelOpen)
  const togglePanel = usePresentationStore((state) => state.togglePanel)
  const collapsed = !panelOpen
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(false)
    const id = window.setTimeout(() => setVisible(true), 60)
    return () => window.clearTimeout(id)
  }, [currentSceneIndex])

  if (!scene) return null

  const themeId = scene.visualConfig?.theme ?? scene.environment ?? 'cyberpunk'
  const accent = themeAccent[themeId] ?? themeAccent.cyberpunk
  const worldName = scene.world ?? getTheme(themeId).name
  const isLight = LIGHT_THEMES.has(themeId)
  const bullets = scene.bullets ?? []
  const code = scene.code ?? []

  return (
    <div
      className={`scene-panel ${collapsed ? 'collapsed' : ''} ${visible ? 'visible' : ''} ${isLight ? 'light' : ''}`}
      style={{ '--accent': accent } as React.CSSProperties}
    >
      <button
        type="button"
        className="scene-panel-toggle"
        onClick={togglePanel}
        aria-label={collapsed ? 'Mostrar contenido' : 'Ocultar contenido'}
      >
        {collapsed ? '❯' : '❮'}
      </button>

      {!collapsed && (
        <div className="scene-panel-body">
          <div className="scene-panel-kicker">
            <span className="scene-panel-dot" />
            {worldName}
          </div>
          <h1 className="scene-panel-title">{scene.title}</h1>
          <p className="scene-panel-sub">{scene.content}</p>

          {bullets.length > 0 && (
            <ul className="scene-panel-bullets">
              {bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          )}

          {code.length > 0 && (
            <div className="scene-panel-codeblock">
              {scene.codeTitle && <div className="scene-panel-codetitle">{scene.codeTitle}</div>}
              <pre className="scene-panel-code">{code.join('\n')}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
