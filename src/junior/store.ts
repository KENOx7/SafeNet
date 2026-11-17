import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { visitors } from './cases.ts'

export interface JuniorDecision {
  id: string
  day: number
  safe: boolean
  correct: boolean
  clue?: boolean
  reply?: boolean
}
const initial = {
  phase: 'welcome' as 'welcome' | 'briefing' | 'playing' | 'report' | 'failed' | 'end',
  day: 0, index: 0, decisions: [] as JuniorDecision[], clueFound: false,
  muted: false,
  pending: null as JuniorDecision | null,
}
type State = typeof initial & {
  begin: () => void
  openPost: () => void
  findClue: () => void
  reply: (index: number) => boolean
  answer: (safe: boolean) => boolean
  advance: () => void
  nextDay: () => void
  retry: () => void
  reset: () => void
  toggleMute: () => void
}

export function juniorTotals(decisions: JuniorDecision[]) {
  const correct = decisions.filter(item => item.correct).length
  return { correct, score: correct * 10, coins: correct * 5, shields: Math.max(0, 3 - decisions.filter(item => !item.correct).length) }
}

export const useJunior = create<State>()(persist((set, get) => ({
  ...initial,
  begin: () => { if (get().phase === 'welcome') set({ phase: 'briefing' }) },
  openPost: () => { if (get().phase === 'briefing') set({ phase: 'playing' }) },
  findClue: () => {
    const state = get()
    if (state.phase !== 'playing' || state.pending) return
    set({ clueFound: true })
  },
  reply: index => {
    const state = get()
    const entry = visitors[state.day][state.index]
    if (state.phase !== 'playing' || !state.pending?.correct || entry.reply === undefined || index !== entry.reply) return false
    const pending = { ...state.pending, reply: true }
    set({ pending, decisions: state.decisions.map(item => item.id === pending.id ? pending : item) })
    return true
  },
  answer: safe => {
    const state = get()
    if (state.phase !== 'playing' || state.pending) return false
    const visitor = visitors[state.day][state.index]
    const record = { id: visitor.id, day: state.day, safe, correct: safe === visitor.safe, clue: state.clueFound }
    set({ decisions: [...state.decisions, record], pending: record })
    return true
  },
  advance: () => {
    const state = get()
    if (state.phase !== 'playing' || !state.pending) return
    const visitor = visitors[state.day][state.index]
    if (state.pending.correct && visitor.replies && !state.pending.reply) return
    const cleared = { pending: null, clueFound: false }
    if (!juniorTotals(state.decisions).shields) set({ ...cleared, phase: 'failed' })
    else if (state.index === visitors[state.day].length - 1) set({ ...cleared, phase: 'report' })
    else set({ ...cleared, index: state.index + 1 })
  },
  nextDay: () => {
    const state = get()
    if (state.phase !== 'report') return
    if (state.day === visitors.length - 1) set({ phase: 'end' })
    else set({ phase: 'briefing', day: state.day + 1, index: 0 })
  },
  retry: () => {
    const state = get()
    if (state.phase !== 'failed') return
    set({ phase: 'briefing', index: 0, decisions: state.decisions.filter(item => item.day < state.day),
      pending: null, clueFound: false })
  },
  reset: () => set({ ...initial, muted: get().muted }),
  toggleMute: () => set({ muted: !get().muted }),
}), {
  name: 'oyu-junior-v1',
  version: 1,
  migrate: saved => {
    const previous = saved as Partial<typeof initial>
    if (previous.phase === 'report' && previous.day !== undefined) {
      return { ...previous, phase: 'playing', index: 3, pending: null, clueFound: false }
    }
    return previous
  },
}))
