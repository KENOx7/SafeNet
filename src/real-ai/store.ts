import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { makeRounds } from './rounds.ts'
import type { Round, Variant } from './rounds.ts'

type Run = {
  phase: 'intro' | 'playing' | 'result'
  rounds: Round[]
  index: number
  answers: Variant[]
}

type Game = Run & {
  muted: boolean
  start: () => void
  home: () => void
  toggleMute: () => void
  answer: (choice: Variant) => boolean | undefined
  next: () => void
}

const initial: Run = { phase: 'intro', rounds: [], index: 0, answers: [] }

export const useRealAi = create<Game>()(persist((set, get) => ({
  ...initial,
  muted: true,
  start: () => set({ ...initial, phase: 'playing', rounds: makeRounds() }),
  home: () => set(initial),
  toggleMute: () => set({ muted: !get().muted }),
  answer: choice => {
    const run = get()
    const round = run.rounds[run.index]
    if (run.phase !== 'playing' || !round || run.answers.length !== run.index) return
    set({ answers: [...run.answers, choice] })
    return choice === round.variant
  },
  next: () => {
    const run = get()
    if (run.phase !== 'playing' || run.answers.length !== run.index + 1) return
    if (run.index === run.rounds.length - 1) set({ phase: 'result' })
    else set({ index: run.index + 1 })
  },
}), { name: 'oyu-real-ai-v1' }))
