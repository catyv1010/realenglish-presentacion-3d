import type { WorldDefinition } from './types'

const worlds: Record<string, WorldDefinition> = {}

export function registerWorld(world: WorldDefinition) {
  worlds[world.id] = world
}

export function getWorld(id: string): WorldDefinition | undefined {
  return worlds[id]
}

export function getWorldIds(): string[] {
  return Object.keys(worlds)
}
