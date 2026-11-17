import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { levels } from './levels.ts'

type State = {
  phase: 'intro' | 'playing' | 'success' | 'end'; level: number; foundIds: Set<string>
  completed: number; muted: boolean; hint: boolean; notice: string
  begin: () => void; redact: (id: string) => boolean; share: () => boolean
  next: () => void; toggleMute: () => void; showHint: () => void; inspectSafe: () => void
}
const fresh = () => ({ phase: 'intro' as const, level: 0, foundIds: new Set<string>(), completed: 0, hint: false, notice: '' })
export const useDetective = create<State>()(persist((set, get) => ({
  ...fresh(), muted: false,
  begin: () => set({ ...fresh(), phase: 'playing' }),
  redact: id => {
    const s = get(); const clue = levels[s.level].clues.find(item => item.id === id)
    if (s.phase !== 'playing' || !clue || s.foundIds.has(id)) return false
    set({ foundIds: new Set([...s.foundIds, id]), notice: clue.explanation })
    return true
  },
  share: () => {
    const s = get()
    if (s.phase !== 'playing') return false
    if (!levels[s.level].clues.every(clue => s.foundIds.has(clue.id))) {
      set({ notice: 'Hələ şəxsi məlumat görünür. İki məlumatı da gizlət, sonra paylaş.' }); return false
    }
    set({ phase: 'success' }); return true
  },
  next: () => {
    const s = get(); if (s.phase !== 'success') return
    if (s.level === levels.length - 1) set({ phase: 'end', completed: s.level + 1, foundIds: new Set() })
    else set({ phase: 'playing', level: s.level + 1, completed: s.level + 1, foundIds: new Set(), hint: false, notice: '' })
  },
  toggleMute: () => set({ muted: !get().muted }),
  showHint: () => set({ hint: true }),
  inspectSafe: () => { if (get().phase === 'playing') set({ notice: 'Bu hissədə gizlədiləcək şəxsi məlumat yoxdur. Lövhələri və yazıları yoxla.' }) },
}), {
  name: 'oyu-detective-v1',
  storage: createJSONStorage(() => localStorage, {
    replacer: (_key, value) => value instanceof Set ? { kind: 'Set', values: [...value] } : value,
    reviver: (_key, value) => value && typeof value === 'object' && 'kind' in value && value.kind === 'Set' && 'values' in value ? new Set(value.values as string[]) : value,
  }),
}))
