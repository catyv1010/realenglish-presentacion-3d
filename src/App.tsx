import { SceneCanvas } from './components/3d/SceneCanvas'
import { NavigationControls } from './components/ui/NavigationControls'
import { SceneOverlay } from './components/ui/SceneOverlay'
import { useAutoPlay } from './hooks/useAutoPlay'
import { useAudioAnalysis } from './hooks/useAudioAnalysis'
import './App.css'

function App() {
  useAutoPlay()
  useAudioAnalysis()
  return (
    <div className="app-container">
      <SceneCanvas />
      <SceneOverlay />
      <NavigationControls />
    </div>
  )
}

export default App
