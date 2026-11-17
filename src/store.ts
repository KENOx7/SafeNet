import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getCases } from './game/scenarios.ts'
import type { Tool, Verdict } from './game/scenarios.ts'
import { getStreak, score } from './game/rules.ts'
import { canChoose, unlocked } from './game/guide.ts'
import { proofFor } from './game/proofs.ts'
import type { Decision } from './game/rules.ts'

type Phase = 'intro' | 'briefing' | 'desk' | 'summary' | 'report' | 'ending'
const initial = {
  phase: 'intro' as Phase, day: 0, index: 0, security: 100, trust: 100, budget: 2, xp: 0,
  decisions: [] as Decision[], opened: false, verified: false, checked: [] as Tool[], pinned: [] as number[], pending: null as Decision | null,
}
interface GameStore extends typeofInitial {
  muted: boolean
  begin: (withAssessment?: boolean) => void
  openMail: () => void
  startShift: () => void
  inspect: (tool: Tool) => void
  pin: (index: number) => boolean
  verify: () => boolean
  decide: (verdict: Verdict) => boolean
  advance: () => void
  nextShift: () => void
  showEnding: () => void
  reset: () => void
  toggleMute: () => void
}
type typeofInitial = typeof initial
const clamp = (value: number) => Math.max(0, Math.min(100, value))

export const useGame = create<GameStore>()(persist((set, get) => ({
  ...initial,
  muted: false,
  begin: withAssessment => {
    if (get().phase !== 'intro') return
    if (withAssessment) set({ phase: 'briefing' })
    else set({ phase: 'desk', day: 1, budget: 3 })
  },
  openMail: () => { if (get().phase === 'desk') set({ opened: true }) },
  startShift: () => { if (get().phase === 'briefing') set({ phase: 'desk' }) },
  inspect: tool => {
    const state = get()
    if (state.phase === 'desk' && !state.pending && unlocked(state.day, state.index).tools.includes(tool) && !state.checked.includes(tool)) {
      set({ checked: [...state.checked, tool] })
    }
  },
  pin: index => {
    const state = get()
    const entry = getCases(state.day)[state.index]
    if (state.phase !== 'desk' || state.pending || !entry || !proofFor(entry.id)?.answers.includes(index)) return false
    if (!state.pinned.includes(index)) set({ pinned: [...state.pinned, index] })
    return true
  },
  verify: () => {
    const state = get()
    if (state.phase !== 'desk' || state.pending || state.verified || state.budget <= 0 || !unlocked(state.day, state.index).verify) return false
    set({ verified: true, budget: state.budget - 1 })
    return true
  },
  decide: verdict => {
    const state = get()
    const entry = getCases(state.day)[state.index]
    if (state.phase !== 'desk' || state.pending || !entry || !canChoose(entry, state, verdict)) return false
    const result = score(entry, verdict, state.verified, state.checked)
    const campaign = state.day >= 1 && state.day <= 3
    const security = campaign ? clamp(state.security + result.security) : state.security
    const trust = campaign ? clamp(state.trust + result.trust) : state.trust
    const bonus = result.correct ? Math.min(3, getStreak(state.decisions)) * 25 : 0
    const recorded = {
      ...result,
      security: security - state.security,
      trust: trust - state.trust,
      xp: campaign ? result.xp + bonus : 0,
    }
    set({
      pending: recorded,
      decisions: [...state.decisions, recorded],
      security,
      trust,
      xp: state.xp + recorded.xp,
    })
    return true
  },
  advance: () => {
    const state = get()
    if (state.phase !== 'desk' || !state.pending) return
    const next = state.index + 1
    const cleared = { pending: null, opened: false, verified: false, checked: [], pinned: [] }
    if (next < getCases(state.day).length) set({ ...cleared, index: next })
    else set({ ...cleared, phase: state.day === 4 ? 'report' : 'summary' })
  },
  nextShift: () => {
    const state = get()
    if (state.phase !== 'summary') return
    if (state.day >= 4) { set({ phase: 'report' }); return }
    set({ phase: 'briefing', day: state.day + 1, index: 0, budget: state.day === 3 ? 2 : 3 })
  },
  showEnding: () => { if (get().phase === 'report') set({ phase: 'ending' }) },
  reset: () => set(initial),
  toggleMute: () => set(state => ({ muted: !state.muted })),
}), { name: 'trust-please-v2' }))
