import { useState, useEffect, useLayoutEffect, useRef } from 'react'
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
  const listaRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    setVisible(false)
    const id = window.setTimeout(() => setVisible(true), 60)
    return () => window.clearTimeout(id)
  }, [currentSceneIndex])

  // Ajuste automatico del tamano del texto: arranca en el mas grande y baja de
  // medio punto en medio punto hasta que los bullets entren sin scroll. Asi cada
  // escena usa la letra mas grande posible y nunca hay que desplazar en vivo.
  useLayoutEffect(() => {
    const lista = listaRef.current
    if (!lista) return

    const MAX = 20
    const MIN = 14
    const COMODO = 17 // por debajo de esto ya cuesta leerlo proyectado

    // Baja de medio en medio punto hasta que los bullets entren sin scroll.
    const encoger = () => {
      let px = MAX
      lista.style.setProperty('--bullet-size', `${px}px`)
      let vueltas = 0
      while (lista.scrollHeight > lista.clientHeight + 1 && px > MIN && vueltas < 40) {
        px -= 0.5
        lista.style.setProperty('--bullet-size', `${px}px`)
        vueltas += 1
      }
      return px
    }

    const ajustar = () => {
      const bloque = lista.parentElement?.querySelector<HTMLElement>('.scene-panel-codeblock')
      if (bloque) bloque.style.maxHeight = ''
      const px = encoger()
      // Si el texto quedo demasiado chico y hay fragmento de codigo, el codigo
      // cede altura (conserva su scroll propio) y se reintenta con letra mayor.
      if (px < COMODO && bloque) {
        bloque.style.maxHeight = '92px'
        encoger()
      }
    }

    ajustar()
    // Recalcular cuando terminen de cargar las tipografias y al cambiar de tamano
    // la ventana (por ejemplo al pasar a pantalla completa para exponer).
    document.fonts?.ready.then(ajustar).catch(() => {})
    window.addEventListener('resize', ajustar)
    return () => window.removeEventListener('resize', ajustar)
  }, [currentSceneIndex, collapsed])

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
            <ul className="scene-panel-bullets" ref={listaRef}>
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
