import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defenses, maxHealth, resolve, reward, waves } from './rules.ts'
import type { Defendable, Installations, Outcome, Shield, Threat } from './rules.ts'

interface WaveCheckpoint {
  health: number
  blocked: number
  delivered: number
}

const initial = {
  phase: 'setup' as 'setup' | 'running' | 'clear' | 'won' | 'lost',
  wave: 0, credits: 110, health: maxHealth, elapsed: 0, blocked: 0, delivered: 0, paused: false,
  installed: {} as Installations, outcomes: [] as Outcome[], shield: null as Shield | null,
  checkpoint: null as WaveCheckpoint | null,
}
type State = typeof initial & {
  install: (node: Defendable, item: Threat) => boolean
  remove: (node: Defendable) => void
  playWave: () => void
  pause: () => void
  tick: (delta: number) => void
  protect: (node: Defendable) => void
  next: () => void
  retry: () => void
  reset: () => void
}

export const useNetwork = create<State>()(persist((set, get) => ({
  ...initial,
  install: (node, item) => {
    const { phase, installed, credits } = get()
    const old = installed[node]
    const price = defenses[item].price - (old ? defenses[old].price : 0)
    if (phase !== 'setup' || credits < price) return false
    set({ credits: credits - price, installed: { ...installed, [node]: item } })
    return true
  },
  remove: node => {
    const { phase, installed, credits } = get()
    const old = installed[node]
    if (phase !== 'setup' || !old) return
    const remaining = { ...installed }
    delete remaining[node]
    set({ credits: credits + defenses[old].price, installed: remaining })
  },
  playWave: () => {
    const { phase, health, blocked, delivered } = get()
    if (phase === 'setup') set({ phase: 'running', paused: false, checkpoint: { health, blocked, delivered } })
  },
  pause: () => {
    const state = get()
    if (state.phase === 'running') set({ paused: !state.paused })
  },
  tick: delta => {
    const state = get()
    if (state.phase !== 'running' || state.paused) return
    if (state.outcomes.some(result => result.verdict === 'hit')) {
      set({ phase: 'lost' })
      return
    }
    const elapsed = state.elapsed + delta
    const packets = waves[state.wave].packets
    const known = new Set(state.outcomes.map(item => item.packet))
    const results = packets.flatMap(packet => {
      const outcome = known.has(packet.id) ? undefined : resolve(packet, elapsed, state.installed, state.shield)
      return outcome ? [outcome] : []
    }).sort((a, b) => a.time - b.time)
    let { outcomes, health, blocked, delivered } = state
    let failed = false
    if (results.length) {
      outcomes = [...outcomes]
      for (const result of results) {
        outcomes.push(result)
        const packet = packets[result.packet]
        if (result.verdict === 'blocked') blocked++
        if (result.verdict === 'delivered') delivered++
        if (result.verdict === 'hit' && packet.kind !== 'normal') {
          health = Math.max(0, health - defenses[packet.kind].damage)
          failed = true
          break
        }
      }
    }
    const complete = outcomes.length === packets.length
    const phase = failed ? 'lost' : complete ? state.wave === waves.length - 1 ? 'won' : 'clear' : 'running'
    set({ elapsed, outcomes, health, blocked, delivered, phase })
  },
  protect: node => {
    const { phase, elapsed, shield, paused } = get()
    if (phase === 'running' && !shield && !paused) set({ shield: { node, from: elapsed, until: elapsed + 3 } })
  },
  next: () => {
    const { phase, credits, wave, outcomes } = get()
    if (phase !== 'clear') return
    if (outcomes.some(result => result.verdict === 'hit')) {
      set({ phase: 'lost' })
      return
    }
    set({ phase: 'setup', credits: credits + reward, wave: wave + 1, outcomes: [], elapsed: 0, shield: null, checkpoint: null })
  },
  retry: () => {
    const { phase, wave, checkpoint, health, blocked, delivered, outcomes } = get()
    if (phase !== 'lost') return
    let restored = checkpoint
    if (!restored) {
      // Older saves have the wave results but no checkpoint.
      restored = { health, blocked, delivered }
      for (const outcome of outcomes) {
        const kind = waves[wave].packets[outcome.packet].kind
        if (outcome.verdict === 'hit' && kind !== 'normal') restored.health = Math.min(maxHealth, restored.health + defenses[kind].damage)
        if (outcome.verdict === 'blocked') restored.blocked = Math.max(0, restored.blocked - 1)
        if (outcome.verdict === 'delivered') restored.delivered = Math.max(0, restored.delivered - 1)
      }
    }
    set({ ...restored, phase: 'setup', outcomes: [], elapsed: 0, shield: null, checkpoint: null, paused: false })
  },
  reset: () => set(initial),
}), {
  name: 'oyu-network-v1',
  merge: (persisted, current) => {
    const state = { ...current, ...(persisted as Partial<State> | undefined) }
    if ((state.phase === 'clear' || state.phase === 'running') && state.outcomes.some(result => result.verdict === 'hit')) state.phase = 'lost'
    return state
  },
}))
