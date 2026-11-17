import { useEffect, useRef } from 'react'
import type { Verdict } from '../game/scenarios.ts'

export type DeskEvent = 'open' | Verdict
export interface DeskPresentation {
  caseId: string
  status: 'sealed' | 'inspect' | 'ready' | 'done'
  canBlock: boolean
  outcome: { verdict: Verdict; correct?: boolean } | null
}

export default function DeskScene({ onAction, caseId, status, canBlock, outcome }: DeskPresentation & {
  onAction: (event: DeskEvent) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const action = useRef(onAction)
  const game = useRef<import('phaser').Game | null>(null)
  const presentation = useRef({ outcome, caseId, status, canBlock })
  useEffect(() => { action.current = onAction }, [onAction])
  useEffect(() => {
    presentation.current = { outcome, caseId, status, canBlock }
    game.current?.events.emit('desk:render', presentation.current)
  }, [outcome, caseId, status, canBlock])

  useEffect(() => {
    let disposed = false
    const target = host.current
    if (!target) return
    void import('./deskPhaser.ts').then(({ createDesk }) => {
      if (!disposed) game.current = createDesk(target, event => action.current(event), () => presentation.current)
    }).catch(() => { /* React controls remain available. */ })
    return () => {
      disposed = true
      game.current?.destroy(true)
      game.current = null
    }
  }, [])

  return <div className="canvas-host" ref={host} aria-hidden="true" />
}
