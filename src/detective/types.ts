export interface StateSnapshot {
  phase: 'intro' | 'playing' | 'success' | 'end'
  level: number
  completed: number
  foundIds: Set<string>
  score: number
  muted: boolean
  hint: boolean
  notice: string
}
