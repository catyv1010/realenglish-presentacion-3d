import { cyberpunkTheme } from './cyberpunk'
import { neuralTheme } from './neural'
import { cosmosTheme } from './cosmos'
import { hospitalTheme } from './hospital'
import { vaultTheme } from './vault'
import { datacenterTheme } from './datacenter'
import { controlTheme } from './control'
import { mindTheme } from './mind'
import { brainTheme } from './brain'
import { forestTheme } from './forest'
import { canopyTheme } from './canopy'
import { academiaTheme } from './academia'
import type { ThemeDefinition } from './types'

const themes: Record<string, ThemeDefinition> = {
  cyberpunk: cyberpunkTheme,
  neural: neuralTheme,
  cosmos: cosmosTheme,
  hospital: hospitalTheme,
  vault: vaultTheme,
  datacenter: datacenterTheme,
  control: controlTheme,
  mind: mindTheme,
  brain: brainTheme,
  forest: forestTheme,
  canopy: canopyTheme,
  academia: academiaTheme,
  // Legacy environment names map to cyberpunk
  city: cyberpunkTheme,
  tables: cyberpunkTheme,
  'rows-columns': cyberpunkTheme,
  'primary-key': cyberpunkTheme,
  'foreign-key': cyberpunkTheme,
  join: cyberpunkTheme,
  index: cyberpunkTheme,
  'sql-query': cyberpunkTheme,
  'full-system': cyberpunkTheme,
}

export function getTheme(id: string): ThemeDefinition {
  return themes[id] ?? cyberpunkTheme
}

export function getThemeIds(): string[] {
  return Array.from(new Set(Object.keys(themes)))
}

export const defaultTheme = cyberpunkTheme
