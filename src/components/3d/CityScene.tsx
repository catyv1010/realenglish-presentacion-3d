import { useMemo } from 'react'
import type { Scene } from '../../types/presentation'
import { usePresentationStore } from '../../store/usePresentationStore'
import { getTheme } from '../../themes/registry'
import { getWorld } from '../../worlds/registry'
import { ConnectionLine } from './ConnectionLine'
import { EnergyCore } from './EnergyCore'
import { DataParticles } from './DataParticles'
import { VolumetricLight } from './VolumetricLight'
import { DroneSwarm } from './DroneSwarm'
import { Hologram } from './Hologram'
import { DataTable3D } from './DataTable3D'
import { ImageBillboard } from './ImageBillboard'

interface CitySceneProps {
  scene: Scene
}

export function CityScene({ scene }: CitySceneProps) {
  const config = scene.visualConfig
  const quality = usePresentationStore((state) => state.quality)
  const themeId = config?.theme ?? scene.environment
  const world = useMemo(() => getWorld(themeId), [themeId])
  const theme = useMemo(() => getTheme(themeId), [themeId])

  const entranceDuration = config?.entranceDuration ?? 1

  // Si existe un mundo personalizado, renderizarlo con control total
  if (world) {
    const World = world.World
    return <World scene={scene} quality={quality} entranceDuration={entranceDuration} />
  }

  const ThemeEnvironment = theme.Environment
  const ThemeBuilding = theme.Building
  const ThemeAtmosphere = theme.Atmosphere

  return (
    <>
      <ThemeEnvironment scene={scene} quality={quality} />
      {ThemeAtmosphere && <ThemeAtmosphere scene={scene} quality={quality} />}

      {/* Buildings rendered by theme */}
      {config?.buildings?.map((building) => (
        <ThemeBuilding
          key={building.id}
          config={building}
          entranceDuration={entranceDuration}
          quality={quality}
        />
      ))}

      {/* Generic connection lines */}
      {config?.connections?.map((connection, index) => (
        <ConnectionLine
          key={index}
          config={connection}
          entranceDuration={entranceDuration}
        />
      ))}

      {/* Energy cores */}
      {config?.energyCores?.map((position, index) => (
        <EnergyCore key={index} position={position} />
      ))}

      {/* Volumetric light from energy cores */}
      {config?.energyCores?.map((position, index) => (
        <VolumetricLight
          key={`light-${index}`}
          position={[position[0], position[1] - 7, position[2]]}
          color="#facc15"
          height={14}
          radius={2.5}
        />
      ))}

      {/* Data particles */}
      {config?.particlePaths?.map((path, index) => (
        <DataParticles key={index} config={path} />
      ))}

      {/* Drones */}
      {config?.drones?.map((drone) => (
        <DroneSwarm key={drone.id} config={drone} />
      ))}

      {/* Holograms */}
      {config?.holograms?.map((hologram) => (
        <Hologram key={hologram.id} config={hologram} />
      ))}

      {/* 3D data tables */}
      {config?.dataTables?.map((table) => (
        <DataTable3D
          key={table.id}
          position={table.position}
          headers={table.headers}
          rows={table.rows}
          color={table.color}
          entranceDelay={table.entranceDelay}
        />
      ))}

      {/* Image/GIF billboards */}
      {config?.imageBillboards?.map((billboard) => (
        <ImageBillboard
          key={billboard.id}
          src={billboard.src}
          position={billboard.position}
          size={billboard.size}
          entranceDelay={billboard.entranceDelay}
        />
      ))}

    </>
  )
}
